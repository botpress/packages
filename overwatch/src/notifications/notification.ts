import type {
  NotificationCommentsContext,
  NotificationHandler,
  NotificationProps,
  NotificationSuccessContext,
} from "./index";

/**
 * A place the loop reports its terminal outcomes to.
 *
 * The base owns *when* something is sent and *what* it says — it holds the caller's handlers
 * and turns each outcome into text — so a transport only has to know how to deliver a string.
 * Adding one is therefore a subclass with a single {@link send} (see {@link Slack}), not a new
 * set of event hooks.
 */
export abstract class Notification {
  /** Transport name; used only to name the destination in log lines when a send fails. */
  abstract readonly name: string;

  constructor(private readonly handlers: NotificationProps) {}

  /** A run opened a PR. */
  notifySuccess(context: NotificationSuccessContext): Promise<void> {
    return this.dispatch(this.handlers.onSuccess, context);
  }

  /** A run left signals unresolved, or threw. */
  notifyFailure(reason: string): Promise<void> {
    return this.dispatch(this.handlers.onFailure, reason);
  }

  /** `applyPrComments` pushed the agent's response to a PR's review comments. */
  notifyCommentsApplied(context: NotificationCommentsContext): Promise<void> {
    return this.dispatch(this.handlers.onCommentsApplied, context);
  }

  private async dispatch<TContext>(
    handler: NotificationHandler<TContext> | undefined,
    context: TContext,
  ): Promise<void> {
    if (!handler) return;
    const text = await handler(context);
    // A blank message counts as an absent handler: the caller looked at this event and decided
    // it wasn't worth reporting.
    if (!text || text.trim() === "") return;
    await this.send(text);
  }

  /**
   * Delivers one already-formatted message. Let failures throw — the loop catches them per
   * destination and logs a warning, so an unreachable transport can't fail a run that
   * otherwise succeeded.
   */
  protected abstract send(text: string): Promise<void>;
}
