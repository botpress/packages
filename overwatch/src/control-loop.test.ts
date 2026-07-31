import { beforeAll, describe, expect, it } from "vitest";
import { ControlLoop } from "./control-loop";
import type { GitSource, PrComment } from "./github";
import { Notification } from "./notifications";
import type { ControlLoopConfig, ControlLoopOptions } from "./types";

beforeAll(() => {
  // Mute RunLog's stderr narration for the suite.
  process.env.CONTROL_LOOP_SILENT = "1";
});

/**
 * The label guard in `applyPrComments` runs before the sandbox is ever provisioned, so a
 * partial `git` stub is all these tests need — the agent/actuator/sensor are never touched
 * on the paths under test.
 */
function loopWith(git: Partial<GitSource>, config: Partial<ControlLoopConfig> = {}): ControlLoop {
  const options = {
    label: "My Loop", // slug -> "my-loop"
    config: { ...config, git: git as GitSource, agent: {} as never },
    sensor: (() => []) as never,
    actuator: {} as never,
  } satisfies Partial<ControlLoopOptions> as ControlLoopOptions;
  return new ControlLoop(options);
}

/** Records what the loop asked a destination to deliver; optionally fails to deliver it. */
class SpyNotification extends Notification {
  readonly name = "spy";
  readonly sent: string[] = [];

  constructor(private readonly failWith?: Error) {
    super({
      onSuccess: (context) => `success: ${context.url}`,
      onFailure: (reason) => reason,
      onCommentsApplied: (context) => `comments: ${context.branch}`,
    });
  }

  protected async send(text: string): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(text);
  }
}

describe("applyPrComments label guard", () => {
  it("refuses a PR that doesn't carry the loop's label", async () => {
    let listed = false;
    const loop = loopWith({
      getPr: async () => ({ branch: "feature", headCommittedAt: "2026-01-01T00:00:00Z", labels: ["other-loop"] }),
      listPrComments: async () => {
        listed = true;
        return [];
      },
    });

    const result = await loop.applyPrComments(1234);

    expect(result).toEqual({ status: "wrong-loop", label: "my-loop", labels: ["other-loop"] });
    // The guard short-circuits before reading comments (and before any sandbox work).
    expect(listed).toBe(false);
  });

  it("proceeds past the guard when the PR carries the loop's label", async () => {
    const loop = loopWith({
      getPr: async () => ({ branch: "feature", headCommittedAt: "2026-01-01T00:00:00Z", labels: ["my-loop"] }),
      // No comments newer than the head -> returns before provisioning a sandbox, proving
      // the guard let a correctly-labeled PR through.
      listPrComments: async (): Promise<PrComment[]> => [],
    });

    const result = await loop.applyPrComments(1234);

    expect(result).toEqual({ status: "no-new-comments" });
  });
});

/**
 * These cover the wiring only — the outcomes reachable without provisioning a sandbox. What each
 * destination does with an event is {@link Notification}'s own suite.
 */
describe("notifications", () => {
  it("says nothing about a skipped run", async () => {
    const spy = new SpyNotification();
    const loop = loopWith({ countOpenPrs: async () => 2 }, {
      notifications: [spy],
      maxOpenPrCount: 1,
    });

    const result = await loop.run();

    expect(result.status).toBe("skipped");
    expect(spy.sent).toEqual([]);
  });

  it("says nothing about a comment event meant for another loop", async () => {
    const spy = new SpyNotification();
    const loop = loopWith(
      {
        getPr: async () => ({
          branch: "feature",
          headCommittedAt: "2026-01-01T00:00:00Z",
          labels: ["other-loop"],
        }),
      },
      { notifications: [spy] },
    );

    await loop.applyPrComments(1234);

    expect(spy.sent).toEqual([]);
  });

  it("reports a run that threw, naming the loop", async () => {
    const spy = new SpyNotification();
    const loop = loopWith(
      {
        countOpenPrs: async () => {
          throw new Error("bad credentials");
        },
      },
      { notifications: [spy], maxOpenPrCount: 1 },
    );

    await expect(loop.run()).rejects.toThrow("bad credentials");
    expect(spy.sent).toEqual(["My Loop — run failed: bad credentials"]);
  });

  it("reports a comment run that threw, naming the PR", async () => {
    const spy = new SpyNotification();
    const loop = loopWith(
      {
        getPr: async () => {
          throw new Error("not found");
        },
      },
      { notifications: [spy] },
    );

    await expect(loop.applyPrComments(1234)).rejects.toThrow("not found");
    expect(spy.sent).toEqual(["My Loop — applying comments to PR #1234 failed: not found"]);
  });

  it("lets a destination that can't be reached fail on its own", async () => {
    // The run's own error is what the caller must see — an unreachable Slack can't replace it,
    // and can't fail a run that succeeded either.
    const broken = new SpyNotification(new Error("invalid_auth"));
    const working = new SpyNotification();
    const loop = loopWith(
      {
        countOpenPrs: async () => {
          throw new Error("bad credentials");
        },
      },
      { notifications: [broken, working], maxOpenPrCount: 1 },
    );

    await expect(loop.run()).rejects.toThrow("bad credentials");
    // The broken destination didn't stop the one after it.
    expect(working.sent).toEqual(["My Loop — run failed: bad credentials"]);
  });
});
