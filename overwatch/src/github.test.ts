import { describe, expect, test } from "vitest";
import { Github } from "./github";

describe("Github constructor", () => {
  test.each([
    "https://github.com/botpress/overwatch.git",
    "https://github.com/botpress/overwatch",
    "git@github.com:botpress/overwatch.git",
    "git@github.com:botpress/overwatch",
  ])("parses owner/repo from %j", (repo) => {
    expect(() => new Github({ repo, branch: "main" })).not.toThrow();
  });

  test("throws on a URL it can't parse owner/repo from", () => {
    expect(() => new Github({ repo: "not-a-repo-url", branch: "main" })).toThrow(/could not parse owner\/repo/);
  });

  test("exposes the configured branch", () => {
    expect(new Github({ repo: "https://github.com/o/r.git", branch: "develop" }).branch).toBe("develop");
  });

  test("treats an empty email as unset", () => {
    const withEmpty = new Github({ repo: "https://github.com/o/r.git", branch: "main", email: "" });
    expect(withEmpty.email).toBeUndefined();
    const withEmail = new Github({ repo: "https://github.com/o/r.git", branch: "main", email: "bot@x.com" });
    expect(withEmail.email).toBe("bot@x.com");
  });
});
