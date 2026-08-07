import { describe, expect, test } from "vitest";
import { Claude, Codex, type AgentContext } from "./agents";

type ExecCall = { command: string; env?: Record<string, string>; timeoutSec?: number };

/**
 * AgentContext stand-in that records every exec. `logOutput` stands in for what the
 * agent left in the redirect file, so a test can tell the log apart from whatever the
 * exec itself reported.
 */
function fakeCtx(over: { exitCode?: number; logOutput?: string; logExitCode?: number } = {}): {
  ctx: AgentContext;
  calls: ExecCall[];
  files: Map<string, string>;
} {
  const calls: ExecCall[] = [];
  const files = new Map<string, string>();
  const ctx: AgentContext = {
    exec: async (command, options) => {
      calls.push({ command, env: options?.env, timeoutSec: options?.timeoutSec });
      if (command.startsWith("cat ")) {
        return { exitCode: over.logExitCode ?? 0, output: over.logOutput ?? "" };
      }
      return { exitCode: over.exitCode ?? 0, output: "exec-side output" };
    },
    writeFile: async (path, content) => {
      files.set(path, content);
    },
  };
  return { ctx, calls, files };
}

const agentCall = (calls: ExecCall[]): ExecCall => calls.find((c) => !c.command.startsWith("cat "))!;

describe.each([
  {
    name: "Claude",
    make: () => new Claude({ apiKey: "k", timeoutSec: 120 }),
    cli: "claude -p",
    envKey: "ANTHROPIC_API_KEY",
  },
  {
    name: "Codex",
    make: () => new Codex({ apiKey: "k", timeoutSec: 120 }),
    cli: "codex exec",
    envKey: "OPENAI_API_KEY",
  },
])("$name.executeAgent", ({ make, cli, envKey }) => {
  test("detaches all three streams from the exec's pipes", async () => {
    const { ctx, calls } = fakeCtx();
    await make().executeAgent("fix it", ctx);
    const command = agentCall(calls).command;
    expect(command).toContain(cli);
    expect(command).toContain("</dev/null");
    expect(command).toContain(">.control-loop/agent.log 2>&1");
  });

  test("stages the prompt rather than passing it as a shell argument", async () => {
    const { ctx, files } = fakeCtx();
    await make().executeAgent("fix it; rm -rf /", ctx);
    expect(files.get(".control-loop/prompt.txt")).toBe("fix it; rm -rf /");
  });

  test("passes the api key and timeout to the agent command", async () => {
    const { ctx, calls } = fakeCtx();
    await make().executeAgent("fix it", ctx);
    const call = agentCall(calls);
    expect(call.env?.[envKey]).toBe("k");
    expect(call.timeoutSec).toBe(120);
  });

  test("reports the redirected log when the agent fails", async () => {
    const { ctx } = fakeCtx({ exitCode: 2, logOutput: "agent stack trace" });
    await expect(make().executeAgent("fix it", ctx)).rejects.toThrow(/exited 2: agent stack trace/);
  });

  test("falls back to the exec's own output when the log is missing", async () => {
    const { ctx } = fakeCtx({ exitCode: 2, logExitCode: 1 });
    await expect(make().executeAgent("fix it", ctx)).rejects.toThrow(/exited 2: exec-side output/);
  });

  test("resolves without reading the log as an error when the agent succeeds", async () => {
    const { ctx } = fakeCtx({ exitCode: 0, logOutput: "all good" });
    await expect(make().executeAgent("fix it", ctx)).resolves.toBeUndefined();
  });
});
