import { describe, expect, it } from "vitest";
import { Slack } from "./slack";

type PostedMessage = { channel?: string; text?: string; thread_ts?: string };

/**
 * Replaces the `WebClient` the constructor built (same approach as `github.test.ts` with its
 * Octokit): what matters here is the `thread_ts` bookkeeping, not the HTTP call.
 */
function slackWith(ts: string | undefined, channel = "#overwatch") {
  const posted: PostedMessage[] = [];
  const slack = new Slack({
    auth: { token: "xoxb-test" },
    channel,
    onSuccess: (context) => `PR: ${context.url}`,
    onCommentsApplied: () => "branch updated",
  });
  const client = {
    chat: {
      postMessage: async (message: PostedMessage) => {
        posted.push(message);
        return { ts };
      },
    },
  };
  (slack as unknown as { client: typeof client }).client = client;
  return { slack, posted };
}

const successContext = { label: "My Loop", url: "https://github.com/o/r/pull/1", signals: [] };
const commentsContext = { label: "My Loop", branch: "control-loop/my-loop-abc", comments: [] };

describe("Slack", () => {
  it("posts the first message to the channel and remembers its ts", async () => {
    const { slack, posted } = slackWith("1712000000.001");

    const state = await slack.notifySuccess(successContext);

    expect(posted).toEqual([
      { channel: "#overwatch", text: "PR: https://github.com/o/r/pull/1", thread_ts: undefined },
    ]);
    expect(state).toEqual({ ts: "1712000000.001" });
  });

  it("replies in the thread of the message it already sent", async () => {
    const { slack, posted } = slackWith("1712000000.999");

    const state = await slack.notifyCommentsApplied(commentsContext, { ts: "1712000000.001" });

    expect(posted[0]?.thread_ts).toBe("1712000000.001");
    // The root stays the root — the reply's own ts is not recorded.
    expect(state).toBeUndefined();
  });

  it("starts a channel message when there is no state to reply to", async () => {
    const { slack, posted } = slackWith("1712000000.999");

    const state = await slack.notifyCommentsApplied(commentsContext, {});

    expect(posted[0]?.thread_ts).toBeUndefined();
    expect(state).toEqual({ ts: "1712000000.999" });
  });

  it("scopes its state to the channel, since a ts can't be threaded in another one", () => {
    expect(slackWith(undefined, "#overwatch").slack.stateKey).toBe("slack:#overwatch");
    expect(slackWith(undefined, "C012AB3CD").slack.stateKey).toBe("slack:C012AB3CD");
  });
});
