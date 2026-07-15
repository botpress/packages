import { describe, expect, test } from "vitest";
import {
  appendMemory,
  commitAll,
  memoryNote,
  memoryPath,
  readMemory,
  runConfiguredCommand,
} from "./sandbox";
import type { RunLog } from "./log";
import type { AgentContext } from "./agents";
import type { PrComment } from "./github";
import type { ControlLoopConfig } from "./types";

/** In-memory AgentContext that records exec commands and staged files. */
function fakeCtx(execImpl?: (command: string) => { exitCode: number; output: string }): {
  ctx: AgentContext;
  commands: string[];
  files: Map<string, string>;
} {
  const commands: string[] = [];
  const files = new Map<string, string>();
  const ctx: AgentContext = {
    exec: async (command) => {
      commands.push(command);
      return execImpl?.(command) ?? { exitCode: 0, output: "" };
    },
    writeFile: async (path, content) => {
      files.set(path, content);
    },
  };
  return { ctx, commands, files };
}

// runConfiguredCommand only uses log.step (run fn, propagate result/throw); a bare stub
// keeps the test off stderr.
const silentLog = () =>
  ({ step: async <T>(_label: string, fn: () => Promise<T>) => fn() }) as unknown as RunLog;

describe("memoryPath", () => {
  test("namespaces the memory file by loop label", () => {
    expect(memoryPath("my-loop")).toBe(".github/control-loop/memory-my-loop.md");
  });
});

describe("memoryNote", () => {
  test("is empty when there is no memory", () => {
    expect(memoryNote(undefined)).toBe("");
    expect(memoryNote("")).toBe("");
  });

  test("wraps existing memory in standing-guidance framing", () => {
    const note = memoryNote("- always prefer X");
    expect(note).toContain("standing guidance");
    expect(note).toContain("- always prefer X");
  });
});

describe("commitAll", () => {
  test("stages everything, then commits with --no-verify", async () => {
    const { ctx, commands } = fakeCtx();
    await commitAll(ctx, "fix: a thing");
    expect(commands[0]).toBe("git add -A");
    expect(commands[1]).toContain("git commit --no-verify -m ");
  });

  test("shell-quotes a message containing single quotes", async () => {
    const { ctx, commands } = fakeCtx();
    await commitAll(ctx, "fix: it's broken");
    expect(commands[1]).toContain(`'fix: it'\\''s broken'`);
  });

  test("throws when git add fails", async () => {
    const { ctx } = fakeCtx((c) => (c === "git add -A" ? { exitCode: 1, output: "boom" } : { exitCode: 0, output: "" }));
    await expect(commitAll(ctx, "m")).rejects.toThrow(/git add failed: boom/);
  });

  test("throws when git commit fails", async () => {
    const { ctx } = fakeCtx((c) =>
      c.startsWith("git commit") ? { exitCode: 1, output: "nothing staged" } : { exitCode: 0, output: "" },
    );
    await expect(commitAll(ctx, "m")).rejects.toThrow(/git commit failed: nothing staged/);
  });
});

describe("runConfiguredCommand", () => {
  const config = (hooks?: ControlLoopConfig["hooks"]): ControlLoopConfig =>
    ({ hooks } as ControlLoopConfig);

  test("is a no-op when the hook is not configured", async () => {
    const { ctx, commands } = fakeCtx();
    await runConfiguredCommand("preCommit", config(), ctx, silentLog());
    expect(commands).toEqual([]);
  });

  test("runs the configured command", async () => {
    const { ctx, commands } = fakeCtx();
    await runConfiguredCommand("setup", config({ setup: "pnpm install" }), ctx, silentLog());
    expect(commands).toEqual(["pnpm install"]);
  });

  test("throws with the command and exit code when it fails", async () => {
    const { ctx } = fakeCtx(() => ({ exitCode: 3, output: "explode" }));
    await expect(
      runConfiguredCommand("preCommit", config({ preCommit: "pnpm fix" }), ctx, silentLog()),
    ).rejects.toThrow(/preCommit command "pnpm fix" exited 3: explode/);
  });
});

describe("readMemory", () => {
  test("returns the file contents when it exists", async () => {
    const { ctx } = fakeCtx((c) => (c.startsWith("cat ") ? { exitCode: 0, output: "remembered" } : { exitCode: 0, output: "" }));
    expect(await readMemory(ctx, "loop")).toBe("remembered");
  });

  test("returns undefined when the file is absent", async () => {
    const { ctx } = fakeCtx(() => ({ exitCode: 1, output: "no such file" }));
    expect(await readMemory(ctx, "loop")).toBeUndefined();
  });
});

describe("appendMemory", () => {
  const comment = (over: Partial<PrComment>): PrComment => ({
    id: 1,
    author: "alice",
    body: "prefer X",
    createdAt: "2026-07-15T10:00:00Z",
    ...over,
  });

  test("creates the memory file with a header on first write", async () => {
    const { ctx, files } = fakeCtx();
    await appendMemory(ctx, "cleanup", undefined, [comment({ body: "prefer named exports" })]);
    const written = files.get(memoryPath("cleanup"));
    expect(written).toContain("# Control loop memory — cleanup");
    expect(written).toContain("- 2026-07-15 @alice: prefer named exports");
  });

  test("appends to existing memory without re-adding the header", async () => {
    const { ctx, files } = fakeCtx();
    const existing = "# Control loop memory — cleanup\n\nintro\n- 2026-07-01 @bob: old note\n";
    await appendMemory(ctx, "cleanup", existing, [comment({ author: "carol", body: "new note" })]);
    const written = files.get(memoryPath("cleanup"))!;
    expect(written.match(/# Control loop memory/g)?.length).toBe(1);
    expect(written).toContain("- 2026-07-01 @bob: old note");
    expect(written).toContain("- 2026-07-15 @carol: new note");
  });

  test("trims each comment body and dates it by day", async () => {
    const { ctx, files } = fakeCtx();
    await appendMemory(ctx, "l", undefined, [comment({ body: "  padded  ", createdAt: "2026-03-04T23:59:59Z" })]);
    expect(files.get(memoryPath("l"))).toContain("- 2026-03-04 @alice: padded");
  });

  test("creates the parent directory before writing", async () => {
    const { ctx, commands } = fakeCtx();
    await appendMemory(ctx, "l", undefined, [comment({})]);
    expect(commands.some((c) => c === "mkdir -p .github/control-loop")).toBe(true);
  });
});
