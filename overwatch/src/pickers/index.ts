import type { Signal } from "../types";

/** Chooses which of the sensed signals to act on this run. */
export type Picker<TData = unknown> = (
  signals: Signal<TData>[],
) => Promise<Signal<TData>[]> | Signal<TData>[];

export { count } from "./count";
export { busiestFile } from "./busiest-file";

/**
 * Runs pickers left-to-right, each narrowing the output of the previous — e.g.
 * `chain(busiestFile(), count(3))` focuses one file, then caps it at 3 signals.
 * Order matters: every step only sees what the one before it kept. With no steps
 * it passes the signals through untouched.
 */
export const chain =
  <TData = unknown>(...steps: Picker<TData>[]): Picker<TData> =>
  async (signals: Signal<TData>[]) => {
    let current = signals;
    for (const step of steps) {
      current = await step(current);
    }
    return current;
  };
