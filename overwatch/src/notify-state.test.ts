import { describe, expect, it } from "vitest";
import { claimMarker, parseClaimedKeys } from "./claims";
import { parseNotifyState, withNotifyState } from "./notify-state";

describe("notify state markers", () => {
  it("round-trips per-destination state through a PR body", () => {
    const states = { "slack:#overwatch": { ts: "1712000000.001" } };
    expect(parseNotifyState(withNotifyState("Automated fix.", states))).toEqual(states);
  });

  it("keeps one marker across repeated updates", () => {
    const first = withNotifyState("Automated fix.", { spy: { ts: "1" } });
    const second = withNotifyState(first, { spy: { ts: "2" } });

    expect(parseNotifyState(second)).toEqual({ spy: { ts: "2" } });
    expect(second.match(/control-loop:notify-state/g)).toHaveLength(1);
  });

  // Both markers live in the same body; writing one must not disturb the other.
  it("leaves the claim marker intact", () => {
    const signals = [{ location: { file: "a.ts" }, message: "naked error" }];
    const body = withNotifyState(`Fixes:\n\n${claimMarker(signals)}`, { spy: { ts: "1" } });

    expect(parseClaimedKeys(body)).toEqual(["a.ts naked error"]);
    expect(parseNotifyState(body)).toEqual({ spy: { ts: "1" } });
  });

  it("removes the marker when there is nothing left to record", () => {
    const body = withNotifyState(withNotifyState("Automated fix.", { spy: { ts: "1" } }), {});

    expect(body).toBe("Automated fix.");
    expect(parseNotifyState(body)).toEqual({});
  });

  it("reads no state from a body that never carried a marker", () => {
    expect(parseNotifyState("A PR a human opened.")).toEqual({});
  });

  // State only groups messages, so a body someone hand-edited (or an older lib wrote) must
  // degrade to "no state" rather than throw on a path that reports a run's outcome.
  it("treats a malformed or non-object marker as absent", () => {
    expect(parseNotifyState("<!-- control-loop:notify-state {oops} -->")).toEqual({});
    expect(parseNotifyState(`<!-- control-loop:notify-state {"spy":"1712.0"} -->`)).toEqual({});
  });
});
