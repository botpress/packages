import { describe, expect, test } from "vitest";
import type { Sandbox } from "@daytona/sdk";
import { RepoHandle } from "./repo-handle";

const REPO = "workspace/repo";

/**
 * Minimal fake sandbox: records the arguments RepoHandle proxies through and returns
 * canned results, so we can assert the path resolve/relativize logic in isolation.
 */
function fakeSandbox(over: {
  searchFiles?: (path: string, pattern: string) => { files: string[] };
  findFiles?: (path: string, pattern: string) => Array<{ file: string; line: number; content: string }>;
  downloadFile?: (path: string) => Buffer;
  executeCommand?: (
    command: string,
    cwd: string,
    env?: Record<string, string>,
    timeout?: number,
  ) => { exitCode: number; result: string };
}) {
  const calls: { findFiles: string[]; executeCommand: Array<{ command: string; cwd: string; timeout?: number }> } = {
    findFiles: [],
    executeCommand: [],
  };
  const sandbox = {
    fs: {
      searchFiles: async (path: string, pattern: string) => over.searchFiles?.(path, pattern) ?? { files: [] },
      findFiles: async (path: string, pattern: string) => {
        calls.findFiles.push(path);
        return over.findFiles?.(path, pattern) ?? [];
      },
      downloadFile: async (path: string) => over.downloadFile?.(path) ?? Buffer.from(""),
    },
    process: {
      executeCommand: async (command: string, cwd: string, env?: Record<string, string>, timeout?: number) => {
        calls.executeCommand.push({ command, cwd, timeout });
        return over.executeCommand?.(command, cwd, env, timeout) ?? { exitCode: 0, result: "" };
      },
    },
  } as unknown as Sandbox;
  return { sandbox, calls };
}

describe("RepoHandle.exec", () => {
  test("runs with the repo root as cwd and a 300s default timeout", async () => {
    const { sandbox, calls } = fakeSandbox({ executeCommand: () => ({ exitCode: 2, result: "out" }) });
    const result = await new RepoHandle(sandbox, REPO).exec("ls");
    expect(result).toEqual({ exitCode: 2, output: "out" });
    expect(calls.executeCommand[0]).toEqual({ command: "ls", cwd: REPO, timeout: 300 });
  });

  test("honors an explicit timeout", async () => {
    const { sandbox, calls } = fakeSandbox({});
    await new RepoHandle(sandbox, REPO).exec("sleep 1", { timeoutSec: 42 });
    expect(calls.executeCommand[0]!.timeout).toBe(42);
  });
});

describe("RepoHandle.readFile", () => {
  test("downloads the repo-relative path and decodes utf-8", async () => {
    let requested = "";
    const { sandbox } = fakeSandbox({
      downloadFile: (path) => {
        requested = path;
        return Buffer.from("héllo", "utf-8");
      },
    });
    const contents = await new RepoHandle(sandbox, REPO).readFile("src/a.ts");
    expect(requested).toBe(`${REPO}/src/a.ts`);
    expect(contents).toBe("héllo");
  });
});

describe("RepoHandle.glob", () => {
  test("relativizes returned absolute paths to the repo root", async () => {
    const { sandbox } = fakeSandbox({
      searchFiles: () => ({ files: [`/abs/${REPO}/src/a.ts`, `/abs/${REPO}/b.ts`] }),
    });
    expect(await new RepoHandle(sandbox, REPO).glob("**/*.ts")).toEqual(["src/a.ts", "b.ts"]);
  });

  test("leaves a path without the repo marker untouched", async () => {
    const { sandbox } = fakeSandbox({ searchFiles: () => ({ files: ["/somewhere/else.ts"] }) });
    expect(await new RepoHandle(sandbox, REPO).glob("*.ts")).toEqual(["/somewhere/else.ts"]);
  });
});

describe("RepoHandle.grep", () => {
  test("defaults to searching the repo root when no paths are given", async () => {
    const { sandbox, calls } = fakeSandbox({});
    await new RepoHandle(sandbox, REPO).grep("TODO");
    expect(calls.findFiles).toEqual([REPO]);
  });

  test.each([
    [".", REPO],
    ["./src", `${REPO}/src`],
    ["src/", `${REPO}/src`],
    ["src/nested/", `${REPO}/src/nested`],
  ])("resolves the search root %j to %j", async (root, resolved) => {
    const { sandbox, calls } = fakeSandbox({});
    await new RepoHandle(sandbox, REPO).grep("TODO", [root]);
    expect(calls.findFiles).toEqual([resolved]);
  });

  test("resolves every root and flattens the matches, relativized", async () => {
    const { sandbox, calls } = fakeSandbox({
      findFiles: (path) => [{ file: `${path}/hit.ts`, line: 3, content: "TODO: x" }],
    });
    const matches = await new RepoHandle(sandbox, REPO).grep("TODO", ["src", "test"]);
    expect(calls.findFiles).toEqual([`${REPO}/src`, `${REPO}/test`]);
    expect(matches).toEqual([
      { file: "src/hit.ts", line: 3, content: "TODO: x" },
      { file: "test/hit.ts", line: 3, content: "TODO: x" },
    ]);
  });
});
