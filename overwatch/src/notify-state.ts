import type { NotifyState } from "./notifications";

/**
 * Per-destination {@link NotifyState}, keyed by `Notification.stateKey`.
 */
export type NotifyStates = Record<string, NotifyState>;

/**
 * The loop has no database and no resident process: the run that opens a PR and the
 * comment-webhook invocation that later updates it are separate processes, minutes or weeks
 * apart. So a notification's state rides along in the PR body, the one place both already
 * look — same trick as the claim marker in `claims.ts`, and equally invisible when rendered.
 *
 * State is per PR by construction, which is exactly the grouping a destination wants: one
 * Slack thread per PR.
 */
const NOTIFY_STATE_MARKER = "control-loop:notify-state";

const MARKER_PATTERN = new RegExp(`\\n*<!-- ${NOTIFY_STATE_MARKER} (\\{.*?\\}) -->`, "s");

/**
 * Body with `states` recorded in it — replacing any marker already there, so a PR accumulates
 * one marker no matter how many times it's updated.
 */
export function withNotifyState(body: string, states: NotifyStates): string {
  const stripped = body.replace(MARKER_PATTERN, "");
  if (Object.keys(states).length === 0) return stripped;
  return `${stripped}\n\n<!-- ${NOTIFY_STATE_MARKER} ${JSON.stringify(states)} -->`;
}

/**
 * States recorded in a PR body, or `{}` for a PR opened before any destination reported on it
 * (or by a version of the lib that didn't write the marker). A malformed marker is treated as
 * absent: state is a convenience for grouping messages, never worth failing a run over.
 */
export function parseNotifyState(body: string): NotifyStates {
  const match = body.match(MARKER_PATTERN);
  if (!match) return {};
  try {
    const parsed = JSON.parse(match[1]!) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, NotifyState] =>
          !!entry[1] && typeof entry[1] === "object" && !Array.isArray(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}
