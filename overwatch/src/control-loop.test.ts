import { beforeAll, describe, expect, it } from "vitest";
import { ControlLoop } from "./control-loop";
import type { GitSource, PrComment } from "./github";
import type { ControlLoopOptions } from "./types";

beforeAll(() => {
  // Mute RunLog's stderr narration for the suite.
  process.env.CONTROL_LOOP_SILENT = "1";
});

/**
 * The label guard in `applyPrComments` runs before the sandbox is ever provisioned, so a
 * partial `git` stub is all these tests need — the agent/actuator/sensor are never touched
 * on the paths under test.
 */
function loopWith(git: Partial<GitSource>): ControlLoop {
  const options = {
    label: "My Loop", // slug -> "my-loop"
    config: { git: git as GitSource, agent: {} as never },
    sensor: (() => []) as never,
    actuator: {} as never,
  } satisfies Partial<ControlLoopOptions> as ControlLoopOptions;
  return new ControlLoop(options);
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
