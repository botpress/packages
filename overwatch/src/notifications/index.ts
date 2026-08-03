import type { PrComment } from "../github";
import type { Signal } from "../types";

/**
 * What a handler returns. `null`/`undefined` (or blank) means "say nothing about this event" —
 * the escape hatch for a handler that only cares about some of the events it's given.
 */
export type NotificationMessage = string | null | undefined;

export type NotificationHandler<TContext> = (
  context: TContext,
) => NotificationMessage | Promise<NotificationMessage>;

/**
 * Whatever a transport wants to remember about a message it already delivered, so a later
 * event on the same PR can build on it instead of starting over — {@link Slack} keeps the
 * message `ts` and replies in its thread.
 *
 * Opaque to the loop, which only stores it (in the PR body, alongside the claim marker) and
 * hands it back to the same transport: it must be JSON-serializable, and a transport must
 * cope with reading back one it wrote arbitrarily long ago, or none at all. It never reaches
 * the caller's handlers — the wording of a message is theirs, delivery mechanics are the
 * transport's.
 */
export type NotifyState = Record<string, unknown>;

/** Handed to `onSuccess` once a run has opened its PR. */
export interface NotificationSuccessContext {
  /** The loop's human-readable label. */
  label: string;
  /** URL of the PR the run opened. */
  url: string;
  /** The signals the run fixed — each verified gone by re-running the sensor. */
  signals: Signal[];
}

/** Handed to `onCommentsApplied` once `applyPrComments` has pushed to the PR's branch. */
export interface NotificationCommentsContext {
  /** The loop's human-readable label. */
  label: string;
  /** The PR branch the agent's response was pushed to. */
  branch: string;
  /** The comments the agent addressed, with any `/feedback` prefix already stripped. */
  comments: PrComment[];
}

/**
 * The handlers every notification accepts — the caller's only say over what gets said, so a
 * destination with no handler for an event stays quiet about it.
 *
 * Only terminal, actionable outcomes are offered. A run that finds nothing (`clean`) or bows
 * out early (`skipped`) notifies nothing: those are the *usual* result for a loop on a
 * schedule, and reporting them would bury the runs that matter.
 */
export interface NotificationProps {
  /** A run fixed its signals and opened a PR. */
  onSuccess?: NotificationHandler<NotificationSuccessContext>;
  /**
   * A run left signals unresolved, or threw. `reason` is already human-readable and names the
   * loop, so `(reason) => reason` is a complete handler.
   */
  onFailure?: NotificationHandler<string>;
  /** New PR review comments were applied and pushed to the PR's branch. */
  onCommentsApplied?: NotificationHandler<NotificationCommentsContext>;
}

// The abstract base lives in its own module (not inline here) for the same reason
// `actuators/actuator.ts` does: under the CommonJS build, a subclass importing its base from
// this barrel — which re-exports the subclass — would hit the base in its temporal dead zone.
export { Notification } from "./notification";
export { Slack, type SlackProps } from "./slack";
