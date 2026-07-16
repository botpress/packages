import { describe, expect, test } from "vitest";
import { CLAIM_MARKER, claimMarker, parseClaimedKeys, signalKey } from "./claims";
import type { Signal } from "./types";

const signal = (file: string | undefined, message: string): Signal =>
  file === undefined ? { message } : { location: { file }, message };

describe("signalKey", () => {
  test("combines file and message", () => {
    expect(signalKey(signal("a.ts", "hello"))).toBe("a.ts hello");
  });

  test("ignores the line number (it shifts after edits)", () => {
    const withLine: Signal = { location: { file: "a.ts", line: 42 }, message: "hi" };
    const withoutLine: Signal = { location: { file: "a.ts" }, message: "hi" };
    expect(signalKey(withLine)).toBe(signalKey(withoutLine));
  });

  test("uses an empty file segment when there is no location", () => {
    expect(signalKey(signal(undefined, "global"))).toBe(" global");
  });
});

describe("claimMarker / parseClaimedKeys", () => {
  test("round-trips the keys of the claimed signals", () => {
    const signals = [signal("a.ts", "1"), signal("b.ts", "2")];
    const parsed = parseClaimedKeys(claimMarker(signals));
    expect(parsed).toEqual(["a.ts 1", "b.ts 2"]);
  });

  test("produces an HTML comment carrying the marker token", () => {
    const marker = claimMarker([signal("a.ts", "1")]);
    expect(marker.startsWith("<!--")).toBe(true);
    expect(marker.endsWith("-->")).toBe(true);
    expect(marker).toContain(CLAIM_MARKER);
  });

  test("finds the marker embedded in a larger PR body", () => {
    const body = `Fixes some stuff.\n\n${claimMarker([signal("x.ts", "boom")])}\n\nThanks!`;
    expect(parseClaimedKeys(body)).toEqual(["x.ts boom"]);
  });

  test("survives a multi-line body (dotAll)", () => {
    const body = `line one\nline two\n${claimMarker([signal("x.ts", "boom")])}`;
    expect(parseClaimedKeys(body)).toEqual(["x.ts boom"]);
  });

  test("returns [] when there is no marker", () => {
    expect(parseClaimedKeys("just a normal PR body")).toEqual([]);
  });

  test("returns [] when the marker payload is not valid JSON", () => {
    expect(parseClaimedKeys(`<!-- ${CLAIM_MARKER} [not json -->`)).toEqual([]);
  });

  test("keeps only string entries from a mixed array", () => {
    const body = `<!-- ${CLAIM_MARKER} ["ok", 1, null, "fine"] -->`;
    expect(parseClaimedKeys(body)).toEqual(["ok", "fine"]);
  });

  test("returns [] when the payload is valid JSON but not an array", () => {
    const body = `<!-- ${CLAIM_MARKER} ["x"] -->`.replace('["x"]', '{"not":"array"}');
    // parseClaimedKeys only matches a `[...]` payload, so a non-array never matches.
    expect(parseClaimedKeys(body)).toEqual([]);
  });

  test("an empty claim list round-trips to []", () => {
    expect(parseClaimedKeys(claimMarker([]))).toEqual([]);
  });
});
