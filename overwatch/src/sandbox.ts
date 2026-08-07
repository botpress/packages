import type { AgentContext } from "./agents";
import type { PrComment } from "./github";
import type { ControlLoopConfig } from "./types";
import type { RunLog } from "./log";

/** Where every entry point clones the repo inside the sandbox. */
export const REPO_PATH = "workspace/repo";
/** Per-run bookkeeping dir (prompts, sensor scripts); never committed to a PR. */
export const SCRATCH_DIR = ".control-loop";

/**
 * Stages and commits everything with the real git binary. Daytona's toolbox git (go-git)
 * 500s on pathological filenames an agent can leave behind (e.g. a file named `\`);
 * real git handles them.
 *
 * `--no-verify` skips repo git hooks: they target interactive developers (a check-only
 * hook like `oxfmt --check` can never be satisfied by a bot that doesn't know the fix
 * command), and the PR's CI is the authoritative gate for the loop's changes. Repo
 * conventions are applied through `config.hooks.preCommit` instead.
 */
export async function commitAll(ctx: AgentContext, message: string): Promise<void> {
  const add = await ctx.exec("git add -A");
  if (add.exitCode !== 0) throw new Error(`git add failed: ${add.output}`);
  const commit = await ctx.exec(`git commit --no-verify -m ${shellQuote(message)}`);
  if (commit.exitCode !== 0) throw new Error(`git commit failed: ${commit.output}`);
}

/** Single-quote for the shell; commit messages carry arbitrary sensor/signal text. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

/**
 * Extra seconds allowed past a command's own timeout before the client gives up on it.
 * Wide enough that a server-side timeout, which produces a real error mentioning the
 * command's output, always wins the race over this comparatively blind one.
 */
const DEADLINE_GRACE_SEC = 60;

/**
 * Arms a client-side deadline on a sandbox command.
 *
 * The sandbox SDK sends `timeout` as a field in the request body and never arms one
 * locally — no axios timeout, no abort signal — so the promise settles only when the
 * server sends a response. When it doesn't (a connection dropped mid-command, a process
 * that never releases the exec) the run hangs indefinitely with no way back. Racing the
 * call against a timer turns that into an ordinary failure the loop can report.
 *
 * A non-positive `timeoutSec` means "no timeout" and is passed through untouched.
 */
export function withDeadline<T>(work: Promise<T>, timeoutSec: number, command: string): Promise<T> {
  if (timeoutSec <= 0) return work;
  const limit = timeoutSec + DEADLINE_GRACE_SEC;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`command produced no response within ${limit}s: ${command}`));
    }, limit * 1000);
  });
  // The losing promise keeps running; unref'ing the timer keeps a pending deadline from
  // holding the process open once the run itself is done.
  timer?.unref?.();
  return Promise.race([work, deadline]).finally(() => clearTimeout(timer));
}

/**
 * Runs one of the configured lifecycle hooks (`config.hooks`) from the repo root,
 * as a logged step. A missing hook is a no-op; a non-zero exit aborts the run.
 */
export async function runConfiguredCommand(
  name: keyof NonNullable<ControlLoopConfig["hooks"]>,
  config: ControlLoopConfig,
  ctx: AgentContext,
  log: RunLog,
): Promise<void> {
  const command = config.hooks?.[name];
  if (!command) return;
  await log.step(`running ${name} \`${command}\``, async () => {
    const result = await ctx.exec(command, { timeoutSec: 900 });
    if (result.exitCode !== 0) {
      throw new Error(`${name} command "${command}" exited ${result.exitCode}: ${result.output}`);
    }
  });
}

/**
 * The loop's memory lives in the repo itself, so it ships with the PR that recorded it
 * and is available to every future clone once merged.
 */
export function memoryPath(label: string): string {
  return `.github/control-loop/memory-${label}.md`;
}

export async function readMemory(ctx: AgentContext, label: string): Promise<string | undefined> {
  const result = await ctx.exec(`cat ${memoryPath(label)}`);
  return result.exitCode === 0 ? result.output : undefined;
}

export async function appendMemory(
  ctx: AgentContext,
  label: string,
  existing: string | undefined,
  feedback: PrComment[],
): Promise<void> {
  const header =
    `# Control loop memory — ${label}\n\n` +
    "Improvements collected from `/feedback` PR comments. " +
    "Every entry is included in the agent's instructions on all future runs of this loop.\n";
  const entries = feedback.map(
    (comment) => `- ${comment.createdAt.slice(0, 10)} @${comment.author}: ${comment.body.trim()}`,
  );
  const content = `${(existing ?? header).trimEnd()}\n${entries.join("\n")}\n`;
  await ctx.exec(`mkdir -p ${memoryPath(label).split("/").slice(0, -1).join("/")}`);
  await ctx.writeFile(memoryPath(label), content);
}

/** Appended to the agent's instructions whenever the loop has accumulated memory. */
export function memoryNote(memory: string | undefined): string {
  if (!memory) return "";
  return `\n\nControl loop memory — standing guidance accumulated from human feedback on past PRs. Follow it:\n${memory}`;
}
