import type { Sandbox } from "@daytona/sdk";
import { describe, expect, test } from "vitest";
import { GithubApp, Github } from "./github";

/**
 * A Sandbox stand-in whose `process.executeCommand` is driven by a router. The router
 * sees each command string and returns an `{ exitCode, result }` for it; every command
 * is also recorded so a test can assert what git invocations `push` made and in what order.
 */
function fakeSandbox(route: (command: string) => { exitCode: number; result: string }) {
  const commands: string[] = [];
  const sandbox = {
    process: {
      executeCommand: async (command: string) => {
        commands.push(command);
        const { exitCode, result } = route(command);
        return { exitCode, result, artifacts: { stdout: result } };
      },
    },
  } as unknown as Sandbox;
  return { sandbox, commands };
}

const REJECTED = "! [rejected] feat -> feat (non-fast-forward)\nhint: Updates were rejected";
const github = () => new Github({ repo: "https://github.com/o/r.git", branch: "main", key: "tok" });
const ok = { exitCode: 0, result: "" };

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

describe("Github.push", () => {
  test("pushes once and does not rebase when the branch is up to date", async () => {
    const { sandbox, commands } = fakeSandbox(() => ok);
    await github().push(sandbox, "repo", "feat");
    expect(commands.filter((c) => c.startsWith("git push"))).toHaveLength(1);
    expect(commands.some((c) => c.includes("git rebase"))).toBe(false);
  });

  test("rebases onto the advanced tip and retries when the first push is rejected", async () => {
    let pushes = 0;
    const { sandbox, commands } = fakeSandbox((command) => {
      if (command.startsWith("git push")) return ++pushes === 1 ? { exitCode: 1, result: REJECTED } : ok;
      return ok; // credential setup, fetch+rebase
    });
    await github().push(sandbox, "repo", "feat");
    expect(pushes).toBe(2);
    expect(commands.some((c) => c.includes("git fetch origin 'feat'") && c.includes("git rebase 'origin/feat'"))).toBe(
      true,
    );
  });

  test("aborts the rebase and throws on a genuine divergence conflict", async () => {
    const { sandbox, commands } = fakeSandbox((command) => {
      if (command.startsWith("git push")) return { exitCode: 1, result: REJECTED };
      if (command.includes("git rebase 'origin/")) return { exitCode: 1, result: "CONFLICT in a.ts" };
      return ok;
    });
    await expect(github().push(sandbox, "repo", "feat")).rejects.toThrow(/diverged and auto-rebase hit a conflict/);
    expect(commands).toContain("git rebase --abort");
  });

  test("throws immediately on a non-rejection push failure without rebasing", async () => {
    const { sandbox, commands } = fakeSandbox((command) =>
      command.startsWith("git push") ? { exitCode: 1, result: "fatal: permission denied" } : ok,
    );
    await expect(github().push(sandbox, "repo", "feat")).rejects.toThrow(/permission denied/);
    expect(commands.some((c) => c.includes("git rebase"))).toBe(false);
  });

  test("gives up after a bounded number of rejected attempts", async () => {
    let pushes = 0;
    const { sandbox } = fakeSandbox((command) => {
      if (command.startsWith("git push")) {
        pushes++;
        return { exitCode: 1, result: REJECTED };
      }
      return ok; // rebase always succeeds, but the remote keeps moving
    });
    await expect(github().push(sandbox, "repo", "feat")).rejects.toThrow(/git push failed/);
    expect(pushes).toBe(5);
  });
});

/**
 * Installs stub octokit rest methods on a Github instance. `addLabels` fails its first
 * `labelFailures` calls (then succeeds); every call is counted so a test can assert how
 * many times each endpoint was hit.
 */
function stubOctokit(gh: Github, labelFailures: number) {
  const calls = { create: 0, addLabels: 0, closePr: 0 };
  const rest = {
    issues: {
      createLabel: async () => ({}),
      addLabels: async () => {
        if (++calls.addLabels <= labelFailures) throw new Error("503 service unavailable");
        return {};
      },
    },
    pulls: {
      create: async () => {
        calls.create++;
        return { data: { number: 7, html_url: "https://github.com/o/r/pull/7" } };
      },
      update: async () => {
        calls.closePr++;
        return {};
      },
    },
  };
  (gh as unknown as { octokit: { rest: typeof rest } }).octokit = { rest };
  return calls;
}

describe("Github.openPr", () => {
  const params = { branch: "feat", title: "t", body: "b", label: "loop" };

  test("labels the PR and returns its url on success", async () => {
    const gh = github();
    const calls = stubOctokit(gh, 0);
    await expect(gh.openPr(params)).resolves.toBe("https://github.com/o/r/pull/7");
    expect(calls.addLabels).toBe(1);
    expect(calls.closePr).toBe(0);
  });

  test("retries a transient labeling failure without closing the PR", async () => {
    const gh = github();
    const calls = stubOctokit(gh, 2); // fails twice, third attempt succeeds
    await expect(gh.openPr(params)).resolves.toBe("https://github.com/o/r/pull/7");
    expect(calls.addLabels).toBe(3);
    expect(calls.closePr).toBe(0);
  });

  test("closes the PR and throws when labeling never succeeds", async () => {
    const gh = github();
    const calls = stubOctokit(gh, Infinity);
    await expect(gh.openPr(params)).rejects.toThrow(/unlabeled orphan/);
    expect(calls.closePr).toBe(1);
  });
});

describe("Github.committer", () => {
  test("falls back to the default bot no-reply identity when no email is set", async () => {
    await expect(github().committer()).resolves.toEqual({
      name: "control-loop[bot]",
      email: "control-loop@users.noreply.github.com",
    });
  });

  test("uses the configured email while keeping the default bot name", async () => {
    const gh = new Github({ repo: "https://github.com/o/r.git", branch: "main", email: "bot@x.com" });
    await expect(gh.committer()).resolves.toEqual({ name: "control-loop[bot]", email: "bot@x.com" });
  });
});

describe("GithubApp", () => {
  const app = () =>
    new GithubApp({
      repo: "https://github.com/o/r.git",
      branch: "main",
      appId: 123,
      privateKey: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----",
      installationId: 456,
    });

  /**
   * Stubs the app/user lookups `committer()` makes, counting each so a test can assert the
   * derivation is cached rather than re-fetched. `getAuthenticated` yields the App slug;
   * `getByUsername` yields the bot account's numeric id.
   */
  function stubBotLookups(gh: GithubApp, slug: string, userId: number) {
    const calls = { app: 0, user: 0 };
    const rest = {
      apps: {
        getAuthenticated: async () => {
          calls.app++;
          return { data: { slug } };
        },
      },
      users: {
        getByUsername: async () => {
          calls.user++;
          return { data: { id: userId } };
        },
      },
    };
    (gh as unknown as { octokit: { rest: typeof rest } }).octokit = { rest };
    return calls;
  }

  test("derives the verified bot no-reply identity from the App's account", async () => {
    const gh = app();
    stubBotLookups(gh, "overwatch", 98765);
    await expect(gh.committer()).resolves.toEqual({
      name: "overwatch[bot]",
      email: "98765+overwatch[bot]@users.noreply.github.com",
    });
  });

  test("caches the derivation so the app/user lookups run only once", async () => {
    const gh = app();
    const calls = stubBotLookups(gh, "overwatch", 1);
    await gh.committer();
    await gh.committer();
    expect(calls).toEqual({ app: 1, user: 1 });
  });

  test("prefers an explicitly configured email over the derived one", async () => {
    const gh = new GithubApp({
      repo: "https://github.com/o/r.git",
      branch: "main",
      appId: 123,
      privateKey: "-----BEGIN RSA PRIVATE KEY-----\nfake\n-----END RSA PRIVATE KEY-----",
      installationId: 456,
      email: "custom@x.com",
    });
    const calls = stubBotLookups(gh, "overwatch", 1);
    await expect(gh.committer()).resolves.toEqual({ name: "control-loop[bot]", email: "custom@x.com" });
    expect(calls).toEqual({ app: 0, user: 0 }); // no lookups when overridden
  });

  // A GithubApp is always authenticated (it only ever acts through an installation), so
  // it mints a fresh installation token for git rather than carrying a static key.
  test("mints an installation token per git operation and pushes with it", async () => {
    const gh = app();
    let authCalls = 0;
    (gh as unknown as { octokit: { auth: (opts: unknown) => Promise<{ token: string }> } }).octokit = {
      auth: async () => {
        authCalls++;
        return { token: "ghs_installation_token" };
      },
    };

    const { sandbox, commands } = fakeSandbox(() => ok);
    await gh.push(sandbox, "repo", "feat");

    expect(authCalls).toBe(1);
    expect(commands.filter((c) => c.startsWith("git push"))).toHaveLength(1);
  });
});
