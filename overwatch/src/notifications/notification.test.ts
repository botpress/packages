import { describe, expect, it } from "vitest";
import type { NotificationProps, NotifyState } from "./index";
import { Notification } from "./notification";

/** Minimal transport that records what the base decided to deliver, and with what state. */
class Recorder extends Notification {
  readonly name = "recorder";
  readonly sent: string[] = [];
  readonly states: (NotifyState | undefined)[] = [];
  /** Returned from every `send`, so a test can assert what the base does with it. */
  nextState?: NotifyState;

  constructor(
    props: NotificationProps,
    private readonly failWith?: Error,
  ) {
    super(props);
  }

  protected async send(text: string, state?: NotifyState): Promise<NotifyState | void> {
    if (this.failWith) throw this.failWith;
    this.sent.push(text);
    this.states.push(state);
    return this.nextState;
  }
}

const successContext = { label: "My Loop", url: "https://github.com/o/r/pull/1", signals: [] };
const commentsContext = {
  label: "My Loop",
  branch: "control-loop/my-loop-abc",
  comments: [{ id: 1, body: "tighten this up", author: "someone", createdAt: "2024-01-01T00:00:00Z" }],
};

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

    await recorder.notifyCommentsApplied(commentsContext);

    expect(recorder.sent).toEqual(["My Loop: 1 on control-loop/my-loop-abc"]);
  });

  it("hands the transport the state it was given, and returns what it recorded", async () => {
    const recorder = new Recorder({ onCommentsApplied: () => "branch updated" });
    recorder.nextState = { ts: "222.0" };

    const state = await recorder.notifyCommentsApplied(commentsContext, { ts: "111.0" });

    expect(recorder.states).toEqual([{ ts: "111.0" }]);
    expect(state).toEqual({ ts: "222.0" });
  });

  // How a transport keeps pointing at its first message: it stops recording state after it.
  it("reports no state when the transport recorded none", async () => {
    const recorder = new Recorder({ onCommentsApplied: () => "branch updated" });

    await expect(recorder.notifyCommentsApplied(commentsContext, { ts: "111.0" })).resolves.toBeUndefined();
  });

  it("reports no state for an event it said nothing about", async () => {
    const recorder = new Recorder({ onSuccess: () => null });
    recorder.nextState = { ts: "222.0" };

    await expect(recorder.notifySuccess(successContext)).resolves.toBeUndefined();
    await expect(recorder.notifyFailure("fix failed")).resolves.toBeUndefined();
  });

  it("keys state by name unless a transport narrows it", async () => {
    expect(new Recorder({}).stateKey).toBe("recorder");
  });

  // The loop relies on this: it catches per destination and logs a warning, so a transport that
  // swallowed its own failures would silently drop messages instead.
  it("lets a transport failure propagate to the caller", async () => {
    const recorder = new Recorder({ onFailure: (reason) => reason }, new Error("invalid_auth"));

    await expect(recorder.notifyFailure("fix failed")).rejects.toThrow("invalid_auth");
  });
});
