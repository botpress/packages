import { describe, expect, it } from "vitest";
import type { NotificationProps } from "./index";
import { Notification } from "./notification";

/** Minimal transport that records what the base decided to deliver. */
class Recorder extends Notification {
  readonly name = "recorder";
  readonly sent: string[] = [];

  constructor(
    props: NotificationProps,
    private readonly failWith?: Error,
  ) {
    super(props);
  }

  protected async send(text: string): Promise<void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(text);
  }
}

const successContext = { label: "My Loop", url: "https://github.com/o/r/pull/1", signals: [] };

describe("Notification dispatch", () => {
  it("sends nothing when the event has no handler", async () => {
    const recorder = new Recorder({ onFailure: () => "boom" });

    await recorder.notifySuccess(successContext);

    expect(recorder.sent).toEqual([]);
  });

  it("sends the handler's message", async () => {
    const recorder = new Recorder({ onSuccess: (ctx) => `PR: ${ctx.url}` });

    await recorder.notifySuccess(successContext);

    expect(recorder.sent).toEqual(["PR: https://github.com/o/r/pull/1"]);
  });

  it("awaits an async handler", async () => {
    const recorder = new Recorder({ onFailure: async (reason) => reason.toUpperCase() });

    await recorder.notifyFailure("fix failed");

    expect(recorder.sent).toEqual(["FIX FAILED"]);
  });

  it("treats a null or blank message as opting out of the event", async () => {
    const recorder = new Recorder({
      onSuccess: () => null,
      onFailure: () => "   \n ",
    });

    await recorder.notifySuccess(successContext);
    await recorder.notifyFailure("fix failed");

    expect(recorder.sent).toEqual([]);
  });

  it("passes the comments context through", async () => {
    const recorder = new Recorder({
      onCommentsApplied: (ctx) => `${ctx.label}: ${ctx.comments.length} on ${ctx.branch}`,
    });

    await recorder.notifyCommentsApplied({
      label: "My Loop",
      branch: "control-loop/my-loop-abc",
      comments: [
        { id: 1, body: "tighten this up", author: "someone", createdAt: "2024-01-01T00:00:00Z" },
      ],
    });

    expect(recorder.sent).toEqual(["My Loop: 1 on control-loop/my-loop-abc"]);
  });

  // The loop relies on this: it catches per destination and logs a warning, so a transport that
  // swallowed its own failures would silently drop messages instead.
  it("lets a transport failure propagate to the caller", async () => {
    const recorder = new Recorder({ onFailure: (reason) => reason }, new Error("invalid_auth"));

    await expect(recorder.notifyFailure("fix failed")).rejects.toThrow("invalid_auth");
  });
});
