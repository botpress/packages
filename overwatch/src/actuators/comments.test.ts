import { describe, expect, test } from "vitest";
import { prComments } from "./comments";
import type { PrComment } from "../github";

const comment = (over: Partial<PrComment>): PrComment => ({
  id: 1,
  author: "alice",
  body: "please fix",
  createdAt: "2026-01-01T00:00:00Z",
  ...over,
});

describe("prComments", () => {
  test("renders an inline comment with file and line", async () => {
    const { instructions } = await prComments([comment({ file: "src/a.ts", line: 12, body: "rename this" })]);
    expect(instructions).toContain("- alice on `src/a.ts:12`: rename this");
  });

  test("omits the line when a file comment has no line", async () => {
    const { instructions } = await prComments([comment({ file: "src/a.ts", body: "nit" })]);
    expect(instructions).toContain("- alice on `src/a.ts`: nit");
    expect(instructions).not.toContain("src/a.ts:");
  });

  test("labels a comment without a file as PR-level", async () => {
    const { instructions } = await prComments([comment({ author: "bob", body: "overall LGTM but..." })]);
    expect(instructions).toContain("- bob (PR-level): overall LGTM but...");
  });

  test("lists every comment under the instructions header", async () => {
    const { instructions } = await prComments([
      comment({ id: 1, body: "one" }),
      comment({ id: 2, body: "two", file: "b.ts" }),
    ]);
    expect(instructions).toContain("Comments to address:");
    expect(instructions).toContain("one");
    expect(instructions).toContain("two");
  });

  test("still produces the header with no comments", async () => {
    const { instructions } = await prComments([]);
    expect(instructions).toContain("Comments to address:");
    expect(instructions).toContain("addressing review comments");
  });
});
