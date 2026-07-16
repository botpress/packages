import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";
import { fromFile, fromSignal } from "./instructions";
import type { Signal } from "../types";

describe("fromSignal", () => {
  test("includes location, description, and priority", async () => {
    const signal: Signal = { location: { file: "a.ts", line: 9 }, message: "leaky handle", priority: "high" };
    const { instructions } = await fromSignal()(signal);
    expect(instructions).toContain("- Location: a.ts:9");
    expect(instructions).toContain("- Description: leaky handle");
    expect(instructions).toContain("- Priority: high");
    expect(instructions).toContain("smallest change");
  });

  test("drops the line from the location when unset", async () => {
    const { instructions } = await fromSignal()({ location: { file: "a.ts" }, message: "x" });
    expect(instructions).toContain("- Location: a.ts");
    expect(instructions).not.toContain("a.ts:");
  });

  test("omits location and priority lines when the signal has neither", async () => {
    const { instructions } = await fromSignal()({ message: "repo-wide thing" });
    expect(instructions).not.toContain("- Location:");
    expect(instructions).not.toContain("- Priority:");
    expect(instructions).toContain("- Description: repo-wide thing");
  });
});

describe("fromFile", () => {
  let dir: string;

  afterEach(() => {
    dir = "";
  });

  const tempFileWith = async (contents: string): Promise<string> => {
    dir = await mkdtemp(join(tmpdir(), "overwatch-instructions-"));
    const path = join(dir, "guide.md");
    await writeFile(path, contents);
    return path;
  };

  test("prepends the file contents and appends the signal context", async () => {
    const path = await tempFileWith("# Guide\nDo the thing.\n\n");
    const build = fromFile(path);
    const { instructions } = await build({ location: { file: "a.ts", line: 3 }, message: "bad" });
    expect(instructions).toContain("In a.ts around line 3:");
    expect(instructions).toContain("# Guide\nDo the thing.");
    // trailing whitespace of the file is trimmed before the context block
    expect(instructions).toContain("Do the thing.\n\nIssue to fix:");
    expect(instructions).toContain("- Description: bad");
  });

  test("omits the location preamble when the signal has none", async () => {
    const path = await tempFileWith("Instructions body.");
    const { instructions } = await fromFile(path)({ message: "global" });
    expect(instructions.startsWith("Instructions body.")).toBe(true);
  });

  test("omits the line from the preamble when unset", async () => {
    const path = await tempFileWith("body");
    const { instructions } = await fromFile(path)({ location: { file: "a.ts" }, message: "m" });
    expect(instructions).toContain("In a.ts: ");
    expect(instructions).not.toContain("around line");
  });

  test("reads the file once and caches it across signals", async () => {
    const path = await tempFileWith("cached body");
    const build = fromFile(path);
    await build({ message: "first" });
    // Rewrite the file; the cached builder must not pick the new contents up.
    await writeFile(path, "changed body");
    const { instructions } = await build({ message: "second" });
    expect(instructions).toContain("cached body");
    expect(instructions).not.toContain("changed body");
  });
});
