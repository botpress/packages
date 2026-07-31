import { WebClient } from "@slack/web-api";
import type { NotificationProps } from "./index";
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

  protected async send(text: string): Promise<void> {
    // WebClient throws on a non-ok response (invalid_auth, channel_not_found, …), which is
    // what the base class's contract wants: the loop logs it and carries on.
    await this.client.chat.postMessage({ channel: this.channel, text });
  }
}
