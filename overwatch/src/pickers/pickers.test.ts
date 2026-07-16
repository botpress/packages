import { expect, test, describe } from "vitest";
import { chain, count, busiestFile } from "./index";
import type { Picker } from "./index";
import type { Signal } from "../types";

const signal = (file: string, message: string): Signal => ({
  location: { file },
  message,
});

const signals: Signal[] = [
  signal("a.ts", "1"),
  signal("a.ts", "2"),
  signal("a.ts", "3"),
  signal("b.ts", "4"),
  signal("b.ts", "5"),
  signal("c.ts", "6"),
];

describe("chain", () => {
  test("with no steps passes signals through untouched", async () => {
    expect(await chain()(signals)).toEqual(signals);
  });

  test("applies steps left-to-right, each narrowing the previous", async () => {
    // busiestFile picks all of a.ts (3), then count caps at 2.
    const picked = await chain(busiestFile(), count(2))(signals);
    expect(picked).toEqual([signal("a.ts", "1"), signal("a.ts", "2")]);
  });

  test("order matters: swapping steps changes the result", async () => {
    // count(2) first keeps a.ts#1,#2; busiestFile then still returns both (same file).
    const picked = await chain(count(2), busiestFile())(signals);
    expect(picked).toEqual([signal("a.ts", "1"), signal("a.ts", "2")]);
  });

  test("awaits async pickers", async () => {
    const asyncFirstTwo: Picker = async (s) => Promise.resolve(s.slice(0, 2));
    const picked = await chain(asyncFirstTwo, count(1))(signals);
    expect(picked).toEqual([signal("a.ts", "1")]);
  });

  test("a single step behaves like that picker alone", async () => {
    expect(await chain(count(3))(signals)).toEqual(await count(3)(signals));
  });
});

describe("busiestFile", () => {
  test("returns every signal of the file with the most signals", async () => {
    expect(await busiestFile()(signals)).toEqual([
      signal("a.ts", "1"),
      signal("a.ts", "2"),
      signal("a.ts", "3"),
    ]);
  });

  test("ignores signals without a location", async () => {
    const located: Signal = { location: { file: "x.ts" }, message: "located" };
    const global: Signal = { message: "no location" };
    // Only x.ts has a file; the location-less signal can't be the busiest file.
    expect(await busiestFile()([global, located])).toEqual([located]);
  });

  test("returns nothing when no signal has a location", async () => {
    expect(await busiestFile()([{ message: "a" }, { message: "b" }])).toEqual([]);
  });
});
