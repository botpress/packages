/**
 * The slice of the sandbox an agent is allowed to touch. Commands run with the repo
 * root as cwd; file paths are relative to the repo root.
 */
export interface AgentContext {
  exec: (command: string, options?: { env?: Record<string, string>; timeoutSec?: number }) => Promise<{
    exitCode: number;
    output: string;
  }>;
  writeFile: (path: string, content: string) => Promise<void>;
}

/**
 * A coding agent that can be driven headlessly inside the sandbox. Implementations
 * know how to install their own CLI and how to invoke it with a prompt.
 */
export abstract class Agent {
  /**
   * Called once per run, before any {@link executeAgent} call. Install the agent's CLI
   * here if the sandbox image doesn't already have it.
   */
  async prepare(_ctx: AgentContext): Promise<void> {}

  /** Runs the agent against the repo with the given instructions, applying edits in place. */
  abstract executeAgent(instructions: string, ctx: AgentContext): Promise<void>;
}

const PROMPT_FILE = ".control-loop/prompt.txt";
const LOG_FILE = ".control-loop/agent.log";

/**
 * Writes the prompt to a scratch file and returns a shell fragment that expands to its
 * content. Instructions contain sensor/user text; going through a file avoids re-parsing
 * shell metacharacters inside them.
 */
async function stagePrompt(instructions: string, ctx: AgentContext): Promise<string> {
  await ctx.writeFile(PROMPT_FILE, instructions);
  return `"$(cat ${PROMPT_FILE})"`;
}

/**
 * Runs an agent CLI with all three standard streams detached from the exec's own pipes,
 * then reads the output back from the file.
 *
 * The sandbox reads a command's output until EOF, and EOF arrives only once every process
 * holding the write end has exited — not just the one that was launched. Agents routinely
 * leave descendants behind (a package-manager daemon, a server started to check something),
 * and those inherit the pipe and hold the exec open long after the agent has finished its
 * work and exited. Redirecting to a file leaves the shell as the pipe's only owner, so the
 * command ends when the agent does.
 *
 * `</dev/null` is part of the same story from the other end: it stops a CLI that decides to
 * consult stdin (an approval prompt, a login it thinks is expired) from blocking on input
 * that is never coming.
 */
async function runAgentCli(
  command: string,
  ctx: AgentContext,
  options: { env?: Record<string, string>; timeoutSec?: number },
): Promise<{ exitCode: number; output: string }> {
  const run = await ctx.exec(`${command} </dev/null >${LOG_FILE} 2>&1`, options);
  const log = await ctx.exec(`cat ${LOG_FILE}`);
  // A missing log means the redirect itself never happened; the exec's own output is
  // then the only account of what went wrong.
  return { exitCode: run.exitCode, output: log.exitCode === 0 ? log.output : run.output };
}

export type ClaudeProps = {
  apiKey: string;
  /** e.g. "claude-sonnet-5". Defaults to the CLI's default model. */
  model?: string;
  /** Max seconds for one agent invocation. Default 900. */
  timeoutSec?: number;
};

export class Claude extends Agent {
  constructor(private readonly props: ClaudeProps) {
    super();
  }

  override async prepare(ctx: AgentContext): Promise<void> {
    const check = await ctx.exec("command -v claude");
    if (check.exitCode === 0) return;
    const install = await ctx.exec("npm install -g @anthropic-ai/claude-code", { timeoutSec: 600 });
    if (install.exitCode !== 0) {
      throw new Error(`failed to install claude CLI: ${install.output}`);
    }
  }

  override async executeAgent(instructions: string, ctx: AgentContext): Promise<void> {
    const prompt = await stagePrompt(instructions, ctx);
    const model = this.props.model ? ` --model ${this.props.model}` : "";
    const result = await runAgentCli(`claude -p ${prompt}${model} --dangerously-skip-permissions`, ctx, {
      env: { ANTHROPIC_API_KEY: this.props.apiKey },
      timeoutSec: this.props.timeoutSec ?? 900,
    });
    if (result.exitCode !== 0) {
      throw new Error(`claude exited ${result.exitCode}: ${result.output}`);
    }
  }
}

export type CodexProps = {
  apiKey: string;
  /** e.g. "gpt-5.1-codex". Defaults to the CLI's default model. */
  model?: string;
  /** Max seconds for one agent invocation. Default 900. */
  timeoutSec?: number;
};

export class Codex extends Agent {
  constructor(private readonly props: CodexProps) {
    super();
  }

  override async prepare(ctx: AgentContext): Promise<void> {
    const check = await ctx.exec("command -v codex");
    if (check.exitCode !== 0) {
      const install = await ctx.exec("npm install -g @openai/codex", { timeoutSec: 600 });
      if (install.exitCode !== 0) {
        throw new Error(`failed to install codex CLI: ${install.output}`);
      }
    }

    // Recent Codex CLI versions ignore OPENAI_API_KEY in the environment and require
    // an auth file created by `codex login` ("Missing bearer or basic authentication
    // in header" otherwise). Piping through printenv keeps the key out of the command
    // line; older CLIs without --with-api-key fall back to the deprecated flag.
    const env = { OPENAI_API_KEY: this.props.apiKey };
    const login = await ctx.exec(`printenv OPENAI_API_KEY | codex login --with-api-key`, { env });
    if (login.exitCode !== 0) {
      const legacy = await ctx.exec(`codex login --api-key "$OPENAI_API_KEY"`, { env });
      if (legacy.exitCode !== 0) {
        throw new Error(`codex login failed: ${login.output} ${legacy.output}`);
      }
    }
  }

  override async executeAgent(instructions: string, ctx: AgentContext): Promise<void> {
    const prompt = await stagePrompt(instructions, ctx);
    const model = this.props.model ? ` --model ${this.props.model}` : "";
    // Codex's own sandbox (--sandbox workspace-write) relies on Landlock/seccomp, which
    // fails inside containers — and the Daytona sandbox already isolates everything, so
    // bypassing it is what Codex documents for CI/container use.
    const result = await runAgentCli(
      `codex exec ${prompt}${model} --dangerously-bypass-approvals-and-sandbox --skip-git-repo-check`,
      ctx,
      {
        env: { OPENAI_API_KEY: this.props.apiKey },
        timeoutSec: this.props.timeoutSec ?? 900,
      },
    );
    if (result.exitCode !== 0) {
      throw new Error(`codex exited ${result.exitCode}: ${result.output}`);
    }
  }
}
