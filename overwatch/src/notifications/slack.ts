import { WebClient } from "@slack/web-api";
import type { NotificationProps, NotifyState } from "./index";
import { Notification } from "./notification";

export interface SlackProps extends NotificationProps {
  /** Slack credentials: a bot token (`xoxb-…`) whose app holds the `chat:write` scope. */
  auth: { token: string };
  /**
   * Where to post — a channel id (`C012AB3CD`) or name (`#overwatch`). The bot must be a
   * member of it; Slack answers `not_in_channel` otherwise.
   */
  channel: string;
}

/**
 * Posts each message to one Slack channel via `chat.postMessage`.
 *
 * Messages go out as plain `text` rather than blocks, since the wording is entirely the
 * caller's (see {@link NotificationProps}) — Slack's mrkdwn (`*bold*`, `<url|label>`) works
 * inside it, so a handler can format without this class needing a block vocabulary.
 *
 * Every later message about the same PR (comments applied, a failure) is posted as a reply to
 * the first one, so a PR reads as one thread instead of scattered updates. That's the whole of
 * this transport's {@link NotifyState}: the first message's `ts`.
 */
export class Slack extends Notification {
  readonly name = "slack";
  private readonly client: WebClient;
  private readonly channel: string;

  constructor(props: SlackProps) {
    super(props);
    this.client = new WebClient(props.auth.token);
    this.channel = props.channel;
  }

  /** A `ts` only threads in the channel it was posted to, so the channel is part of the key. */
  override get stateKey(): string {
    return `slack:${this.channel}`;
  }

  protected async send(text: string, state?: NotifyState): Promise<NotifyState | void> {
    const threadTs = typeof state?.ts === "string" ? state.ts : undefined;
    // WebClient throws on a non-ok response (invalid_auth, channel_not_found, …), which is
    // what the base class's contract wants: the loop logs it and carries on. A `thread_ts`
    // pointing at a deleted message is the one case Slack tolerates: it posts to the channel.
    const response = await this.client.chat.postMessage({
      channel: this.channel,
      text,
      thread_ts: threadTs,
    });

    // Only the thread's root is worth remembering — replies keep pointing at it, so returning
    // nothing here (see the base's `send` contract) leaves the stored root in place.
    if (!threadTs && response.ts) return { ts: response.ts };
  }
}
