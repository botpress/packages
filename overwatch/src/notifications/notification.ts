import type {
  NotificationCommentsContext,
  NotificationHandler,
  NotificationProps,
  NotificationSuccessContext,
  NotifyState,
} from "./index";

/**
 * A place the loop reports its terminal outcomes to.
 *
 * The base owns *when* something is sent and *what* it says — it holds the caller's handlers
 * and turns each outcome into text — so a transport only has to know how to deliver a string.
 * Adding one is therefore a subclass with a single {@link send} (see {@link Slack}), not a new
 * set of event hooks.
 *
 * Events about the same PR are linked by {@link NotifyState}: whatever {@link send} returns is
 * persisted by the loop and handed back on the next event for that PR, which is how a transport
 * can group them (Slack threads them) without the loop knowing what a thread is.
 */
export abstract class Notification {
  /** Transport name; used only to name the destination in log lines when a send fails. */
  abstract readonly name: string;

  constructor(private readonly handlers: NotificationProps) {}

  /**
   * Key this destination's {@link NotifyState} is stored under. Override it whenever the state
   * is only valid for part of the config — Slack's message `ts` can only be threaded in the
   * channel it was posted to, so {@link Slack} folds the channel in and a reconfigured channel
   * simply starts fresh instead of replying to a stranger's message.
   */
  get stateKey(): string {
    return this.name;
  }

  /** A run opened a PR. */
  notifySuccess(context: NotificationSuccessContext): Promise<NotifyState | undefined> {
    return this.dispatch(this.handlers.onSuccess, context);
  }

  /** A run left signals unresolved, or threw. */
  notifyFailure(reason: string, state?: NotifyState): Promise<NotifyState | undefined> {
    return this.dispatch(this.handlers.onFailure, reason, state);
  }

  /** `applyPrComments` pushed the agent's response to a PR's review comments. */
  notifyCommentsApplied(
    context: NotificationCommentsContext,
    state?: NotifyState,
  ): Promise<NotifyState | undefined> {
    return this.dispatch(this.handlers.onCommentsApplied, context, state);
  }

  private async dispatch<TContext>(
    handler: NotificationHandler<TContext> | undefined,
    context: TContext,
    state?: NotifyState,
  ): Promise<NotifyState | undefined> {
    if (!handler) return undefined;
    const text = await handler(context);
    // A blank message counts as an absent handler: the caller looked at this event and decided
    // it wasn't worth reporting.
    if (!text || text.trim() === "") return undefined;
    return (await this.send(text, state)) ?? undefined;
  }

  /**
   * Delivers one already-formatted message. `state` is what this transport returned the last
   * time it reported on this PR, if anything; returning a value replaces it, returning nothing
   * leaves the stored one alone — so a transport that wants to keep pointing at its first
   * message (a thread root) returns nothing on the follow-ups.
   *
   * Let failures throw — the loop catches them per destination and logs a warning, so an
   * unreachable transport can't fail a run that otherwise succeeded.
   */
  protected abstract send(text: string, state?: NotifyState): Promise<NotifyState | void>;
}
