import { beforeAll, describe, expect, it } from "vitest";
import { ControlLoop } from "./control-loop";
import type { GitSource, PrComment } from "./github";
import { Notification, type NotifyState } from "./notifications";
import { parseNotifyState } from "./notify-state";
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
  /** The state the loop handed back for each send — how a transport would find its thread. */
  readonly states: (NotifyState | undefined)[] = [];
  /** Recorded by every send, standing in for a transport's "remember this message" step. */
  nextState?: NotifyState;

  constructor(private readonly failWith?: Error) {
    super({
      onSuccess: (context) => `success: ${context.url}`,
      onFailure: (reason) => reason,
      onCommentsApplied: (context) => `comments: ${context.branch}`,
    });
  }

  protected async send(text: string, state?: NotifyState): Promise<NotifyState | void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(text);
    this.states.push(state);
    return this.nextState;
  }
}

describe("applyPrComments label guard", () => {
  it("refuses a PR that doesn't carry the loop's label", async () => {
    let listed = false;
    const loop = loopWith({
      getPr: async () => ({ branch: "feature", headCommittedAt: "2026-01-01T00:00:00Z", labels: ["other-loop"], body: "" }),
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
      getPr: async () => ({ branch: "feature", headCommittedAt: "2026-01-01T00:00:00Z", labels: ["my-loop"], body: "" }),
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
          body: "",
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

  it("hands a destination the state stored on the PR it's reporting about", async () => {
    const spy = new SpyNotification();
    let updates = 0;
    const loop = loopWith(
      {
        getPr: async () => ({
          branch: "feature",
          headCommittedAt: "2026-01-01T00:00:00Z",
          labels: ["my-loop"],
          body: `Automated fix.\n\n<!-- control-loop:notify-state {"spy":{"ts":"111.0"}} -->`,
        }),
        listPrComments: async () => {
          throw new Error("rate limited");
        },
        updatePrBody: async () => {
          updates++;
        },
      },
      { notifications: [spy] },
    );

    await expect(loop.applyPrComments(1234)).rejects.toThrow("rate limited");

    expect(spy.states).toEqual([{ ts: "111.0" }]);
    // The destination recorded nothing new, so the PR body is left alone — an edit shows up in
    // the PR's timeline.
    expect(updates).toBe(0);
  });

  it("records new state on the PR so the next event can be grouped with this one", async () => {
    const spy = new SpyNotification();
    spy.nextState = { ts: "222.0" };
    let written: string | undefined;
    const loop = loopWith(
      {
        getPr: async () => ({
          branch: "feature",
          headCommittedAt: "2026-01-01T00:00:00Z",
          labels: ["my-loop"],
          body: "Automated fix.",
        }),
        listPrComments: async () => {
          throw new Error("rate limited");
        },
        updatePrBody: async (_prNumber, body) => {
          written = body;
        },
      },
      { notifications: [spy] },
    );

    await expect(loop.applyPrComments(1234)).rejects.toThrow("rate limited");

    expect(spy.states).toEqual([undefined]);
    expect(parseNotifyState(written ?? "")).toEqual({ spy: { ts: "222.0" } });
  });

  it("keeps a PR's stored state when a destination can't be reached", async () => {
    // A failed send must not drop the thread the next event would have joined.
    const broken = new SpyNotification(new Error("invalid_auth"));
    let updates = 0;
    const loop = loopWith(
      {
        getPr: async () => ({
          branch: "feature",
          headCommittedAt: "2026-01-01T00:00:00Z",
          labels: ["my-loop"],
          body: `<!-- control-loop:notify-state {"spy":{"ts":"111.0"}} -->`,
        }),
        listPrComments: async () => {
          throw new Error("rate limited");
        },
        updatePrBody: async () => {
          updates++;
        },
      },
      { notifications: [broken] },
    );

    await expect(loop.applyPrComments(1234)).rejects.toThrow("rate limited");
    expect(updates).toBe(0);
  });

  it("doesn't look for stored state when there is nowhere to report", async () => {
    let reads = 0;
    const loop = loopWith({
      getPr: async () => {
        reads++;
        return {
          branch: "feature",
          headCommittedAt: "2026-01-01T00:00:00Z",
          labels: ["my-loop"],
          body: "",
        };
      },
      listPrComments: async () => {
        throw new Error("rate limited");
      },
    });

    await expect(loop.applyPrComments(1234)).rejects.toThrow("rate limited");
    // Only the cycle's own lookup; the notify path added none.
    expect(reads).toBe(1);
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
