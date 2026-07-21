import { runOrchestratorCli } from "./cli";
import type { ControlLoop } from "./control-loop";
import type { ControlLoopRunResult, OrchestratorApplyResult } from "./types";

/**
 * Fronts several {@link ControlLoop}s behind one entry point so a single CI workflow can drive
 * them all — most usefully a lone `pull_request_review_comment` handler that dispatches the event
 * to whichever loop opened the PR, instead of one workflow per loop.
 *
 * Declare the loops, register them, then hand control to the CLI:
 *
 *     new LoopOrchestrator()
 *       .register(nakedErrorLoop)
 *       .register(reactDoctorLoop)
 *       .run();
 *
 * Loops are keyed by their {@link ControlLoop.labelSlug} — the label every PR the loop opens
 * carries. Routing a comment event is therefore just: find the loop whose label the PR carries.
 * All registered loops are expected to target the same repository (a comment webhook is per-repo).
 */
export class LoopOrchestrator {
  // `ControlLoop` is invariant in its signal type (the picker/actuator sit in contravariant
  // positions), so a registry holding loops of differing signal types can only be typed with
  // `any` — none of the orchestrator's own operations touch a loop's signal type anyway.
  private readonly loops: ControlLoop<any>[] = [];

  /**
   * Register a loop. Rejects a loop whose label slug collides with one already registered:
   * two loops with the same slug can't be told apart when routing an event, and would both
   * lay claim to the same PRs.
   */
  register(loop: ControlLoop<any>): this {
    const slug = loop.labelSlug;
    const clash = this.loops.find((existing) => existing.labelSlug === slug);
    if (clash) {
      throw new Error(
        `cannot register "${loop.label}": its label slug "${slug}" collides with the already-` +
          `registered "${clash.label}". Events route by label, so each loop needs a distinct slug.`,
      );
    }
    this.loops.push(loop);
    return this;
  }

  /** The registered loops in registration order, as `{ label, slug }`. */
  list(): { label: string; slug: string }[] {
    return this.loops.map((loop) => ({ label: loop.label, slug: loop.labelSlug }));
  }

  /**
   * Run one full cycle of the loop registered under `slug`. Throws if no loop matches — each
   * loop keeps its own schedule, so callers name exactly which one to run.
   */
  runLoop(slug: string): Promise<ControlLoopRunResult> {
    const loop = this.loops.find((candidate) => candidate.labelSlug === slug);
    if (!loop) {
      const known = this.loops.map((candidate) => candidate.labelSlug).join(", ") || "none";
      throw new Error(`no registered loop with slug "${slug}" (registered: ${known})`);
    }
    return loop.run();
  }

  /**
   * Route a PR comment event to the single loop that owns the PR and apply its new comments.
   * Ownership is decided by label: each loop's {@link ControlLoop.applyPrComments} refuses a PR
   * that doesn't carry its label — returning `wrong-loop` *before* provisioning a sandbox — so
   * probing every loop is cheap, and because slugs are unique at most one loop acts.
   *
   * Returns `no-matching-loop` when the PR belongs to none of them (a mis-routed event), which
   * the CLI surfaces as a non-zero exit.
   */
  async applyPrComments(prNumber: number): Promise<OrchestratorApplyResult> {
    for (const loop of this.loops) {
      const result = await loop.applyPrComments(prNumber);
      if (result.status !== "wrong-loop") {
        return { status: "dispatched", loop: loop.label, result };
      }
    }
    return { status: "no-matching-loop", prNumber };
  }

  /**
   * Ready-made multi-loop CLI — the orchestrator counterpart to {@link ControlLoop.cli}, and the
   * one call an orchestrator script ends with. Subcommands: `run <loop>`, `apply-comments <pr>`,
   * and `list`. Parses `process.argv` by default; the process exits non-zero on error, an
   * unresolved fix, or a comment event that matched no loop, so CI can gate on it.
   */
  run(argv: string[] = process.argv): Promise<void> {
    return runOrchestratorCli(this, argv);
  }
}
