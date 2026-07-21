import type { Agent } from "./agents";
import type { Actuator, CommentActuator } from "./actuators";
import type { Sensor } from "./sensors";
import type { Picker } from "./pickers";
import type { GitSource, PrComment } from "./github";

export type SignalPriority = "low" | "medium" | "high";

/**
 * An anomaly detected by the sensor.
 *
 * Identity note: after a fix, line numbers shift, so a signal is considered "the same"
 * across sensor runs when its `location.file` and `message` match — `location.line` is
 * informational only. Keep `message` stable for a given anomaly (don't embed line numbers
 * or timestamps in it).
 */
export interface Signal<TData = unknown> {
  /**
   * Where the anomaly lives. Optional — some anomalies are repo-wide or not tied to a
   * single place. When present, `file` anchors the signal's identity (see note above).
   */
  location?: { file: string; line?: number };
  message: string;
  /** Optional; treated as unset (rather than a default) wherever no priority is given. */
  priority?: SignalPriority;
  /**
   * Anything the sensor wants to carry through to the picker and actuator untouched.
   * `TData` is inferred from the sensor, so an actuator paired with it sees this exact
   * type on `signal.data` (see {@link ControlLoopOptions}).
   */
  data?: TData;
}

/**
 * Constructor argument of ControlLoop: identity and static settings, behavior alongside them.
 *
 * `TData` is inferred from the `sensor` and flows to the `picker` and `actuator`, so the
 * `data` a sensor attaches to its signals reaches the actuator with the same static type.
 */
export interface ControlLoopOptions<TData = unknown> {
  /**
   * Human-readable name of the loop. Its slug (e.g. "My Loop" -> "my-loop") is applied
   * as a label on every PR the loop opens, and is what `config.maxOpenPrCount` counts
   * against.
   */
  label: string;
  config: ControlLoopConfig;
  sensor: Sensor<TData>;
  /** Defaults to `pickers.count(1)`. */
  picker?: Picker<TData>;
  actuator: Actuator<TData>;
  /** Customizes the instructions built from PR comments in `applyPrComments`. */
  commentActuator?: CommentActuator;
}

export interface ControlLoopConfig {
  /** Skip the run entirely if this many PRs with the loop's label are already open. */
  maxOpenPrCount?: number;
  /**
   * Prefix of the branches the loop pushes, e.g. "bots/cleanup" ->
   * "bots/cleanup/<label-slug>-<run-id>". Default "control-loop".
   */
  branchPrefix?: string;
  git: GitSource;
  agent: Agent;
  /** Shell commands the loop runs inside the sandbox, all from the repo root. */
  hooks?: {
    /**
     * Run right after cloning, before the sensor and agent (e.g. "bun install" to set
     * up dependencies). The run aborts if it exits non-zero.
     */
    setup?: string;
    /**
     * Run after the agent finishes and before committing — typically the repo's
     * auto-fix formatter (e.g. "bun run fix:format"). It normalizes everything the
     * loop commits (agent edits and lib-generated files alike) so the PR passes repo
     * formatting checks. The run aborts if it exits non-zero.
     */
    preCommit?: string;
  };
  /** Environment variables set on the sandbox at creation. */
  env?: Record<string, string>;
  /** Max agent attempts per signal before the run is declared failed. Default 3. */
  maxFixAttempts?: number;
  sandbox?: {
    /**
     * Daytona snapshot to create the sandbox from. Pre-bake your toolchain and the
     * agent's CLI into it to skip per-run installs. Defaults to Daytona's typescript
     * sandbox, with the agent CLI installed at run start.
     */
    snapshot?: string;
  };
}

export type ControlLoopRunResult<TData = unknown> =
  | { status: "skipped"; reason: string }
  | { status: "clean" }
  | { status: "fix-failed"; unresolved: Signal<TData>[] }
  | { status: "pr-opened"; prUrl: string; fixed: Signal<TData>[] };

export type ApplyCommentsResult =
  /**
   * The PR doesn't carry this loop's label, so it isn't one this loop opened — the loop
   * refuses to touch it rather than push another loop's config (and pollute its memory).
   */
  | { status: "wrong-loop"; label: string; labels: string[] }
  /** Every comment predates the PR's head commit — nothing new to address. */
  | { status: "no-new-comments" }
  /** The agent ran but left the working tree untouched, so nothing was pushed. */
  | { status: "no-changes"; comments: PrComment[] }
  | { status: "comments-applied"; branch: string; comments: PrComment[] };

/** Outcome of routing a PR comment event through a `LoopOrchestrator`. */
export type OrchestratorApplyResult =
  /**
   * The PR belonged to `loop`; `result` is that loop's own apply outcome. It can never be
   * `wrong-loop` — that's the signal the orchestrator used to rule a loop *out*.
   */
  | { status: "dispatched"; loop: string; result: Exclude<ApplyCommentsResult, { status: "wrong-loop" }> }
  /** No registered loop carries the PR's label — the comment event was routed to the wrong place. */
  | { status: "no-matching-loop"; prNumber: number };
