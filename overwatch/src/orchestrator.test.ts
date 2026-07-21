import { beforeAll, describe, expect, it } from "vitest";
import { ControlLoop } from "./control-loop";
import type { GitSource, PrComment } from "./github";
import { LoopOrchestrator } from "./orchestrator";
import type { ControlLoopOptions } from "./types";

beforeAll(() => {
  process.env.CONTROL_LOOP_SILENT = "1";
});

/**
 * A loop backed by a partial `git`. The orchestrator paths under test (registration and
 * comment routing) reach `applyPrComments`, whose label guard short-circuits before any
 * sandbox work — so the agent/actuator/sensor are never touched.
 */
function loop(label: string, git: Partial<GitSource> = {}): ControlLoop {
  const options = {
    label,
    config: { git: git as GitSource, agent: {} as never },
    sensor: (() => []) as never,
    actuator: {} as never,
  } satisfies Partial<ControlLoopOptions> as ControlLoopOptions;
  return new ControlLoop(options);
}

/**
 * A git the whole repo shares: `getPr` reports the same `labels` no matter which loop asks
 * (all loops query the same PR in the same repo), and there are no comments to apply — so a
 * loop that owns the PR resolves to `no-new-comments` without provisioning a sandbox.
 */
function repoWithPrLabels(labels: string[]): Partial<GitSource> {
  return {
    getPr: async () => ({ branch: "feature", headCommittedAt: "2026-01-01T00:00:00Z", labels }),
    listPrComments: async (): Promise<PrComment[]> => [],
  };
}

describe("LoopOrchestrator.register", () => {
  it("rejects a second loop whose label slugs to the same value", () => {
    const orchestrator = new LoopOrchestrator().register(loop("My Loop"));
    expect(() => orchestrator.register(loop("my loop"))).toThrow(/collides/);
  });

  it("lists registered loops with their routing slug, in order", () => {
    const orchestrator = new LoopOrchestrator()
      .register(loop("React Doctor Issues"))
      .register(loop("Naked Error"));
    expect(orchestrator.list()).toEqual([
      { label: "React Doctor Issues", slug: "react-doctor-issues" },
      { label: "Naked Error", slug: "naked-error" },
    ]);
  });
});

describe("LoopOrchestrator.applyPrComments routing", () => {
  it("dispatches to the loop whose label the PR carries", async () => {
    const git = repoWithPrLabels(["loop-b"]);
    const orchestrator = new LoopOrchestrator()
      .register(loop("Loop A", git))
      .register(loop("Loop B", git));

    const result = await orchestrator.applyPrComments(1234);

    // Loop A is ruled out (wrong-loop, before any sandbox); Loop B owns the PR.
    expect(result).toEqual({ status: "dispatched", loop: "Loop B", result: { status: "no-new-comments" } });
  });

  it("reports no-matching-loop when the PR carries none of the loops' labels", async () => {
    const git = repoWithPrLabels(["some-human-label"]);
    const orchestrator = new LoopOrchestrator()
      .register(loop("Loop A", git))
      .register(loop("Loop B", git));

    const result = await orchestrator.applyPrComments(1234);

    expect(result).toEqual({ status: "no-matching-loop", prNumber: 1234 });
  });
});

describe("LoopOrchestrator.runLoop", () => {
  it("throws with the known slugs when no loop matches", () => {
    const orchestrator = new LoopOrchestrator().register(loop("Loop A")).register(loop("Loop B"));
    expect(() => orchestrator.runLoop("loop-c")).toThrow(/loop-a, loop-b/);
  });
});
