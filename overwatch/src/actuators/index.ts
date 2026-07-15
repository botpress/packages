import type { Sandbox } from "@daytona/sdk";
import type { AgentContext } from "../agents";
import type { PrComment } from "../github";
import type { RunLog } from "../log";
import type { ControlLoopConfig, Signal } from "../types";

/**
 * Builds the instructions handed to the agent for one signal. Feeds the default
 * {@link Actuator} (`actuators.AgentPrActuator`) — the actuator calls it once per signal
 * to produce the prompt the coding agent runs with. Create one with `actuators.fromFile`
 * or `actuators.fromSignal`.
 */
export type InstructionBuilder<TData = unknown> = (
  signal: Signal<TData>,
) => Promise<{ instructions: string }> | { instructions: string };

/**
 * Builds the instructions handed to the agent when applying PR review comments.
 * Optional — the loop has a sensible default.
 */
export type CommentActuator = (
  comments: PrComment[],
) => Promise<{ instructions: string }> | { instructions: string };

/**
 * Everything an actuator needs to act on the run's picked signals. The sandbox is fully
 * provisioned (repo cloned, git configured, `config.hooks.setup` already run).
 *
 * Note `sandbox` is exposed directly — unlike agents, which only ever see {@link AgentContext} —
 * because an actuator is the layer allowed to drive git (branch, push) and open PRs.
 */
export interface ActuatorInput<TData = unknown> {
  /** The signals the picker selected to act on this run. */
  signals: Signal<TData>[];
  /** The provisioned sandbox. */
  sandbox: Sandbox;
  /** Narrow exec/writeFile surface into the sandbox, with the repo root as cwd. */
  ctx: AgentContext;
  /** Re-runs the sensor — actuators that fix-then-verify use this to confirm resolution. */
  sense: () => Promise<Signal<TData>[]>;
  /** The loop's static configuration. */
  config: ControlLoopConfig;
  /** Slugified loop label — used for the branch, PR label, and memory file. */
  label: string;
  /** Human-readable loop label — used in PR titles and bodies. */
  displayLabel: string;
  /** The run's logger. */
  log: RunLog;
}

// The abstract base lives in its own module (not inline here) so the sibling default
// implementations can `extends Actuator` without forming a require-cycle with this
// barrel — under the CommonJS build a subclass that imported its base from the barrel,
// which in turn re-exports the subclass, would hit the base in its temporal dead zone.
export { Actuator } from "./actuator";
export { AgentPrActuator, type AgentPrActuatorProps } from "./agent-pr";
export { fromFile, fromSignal } from "./instructions";
export { prComments } from "./comments";
