import type { Signal } from "../types";
import type { Picker } from "./index";

/**
 * Picker: takes every signal belonging to the single busiest file — the file with
 * the most signals this run. Focuses one run on one file so all its fixes land in a
 * single, coherent PR. Ties are broken toward the file whose first signal appears
 * earliest in sensor order. Signals without a `location` have no file to group by and
 * are ignored (they can never be the busiest file).
 */
export const busiestFile =
  <TData = unknown>(): Picker<TData> =>
  (signals: Signal<TData>[]) => {
    const byFile = new Map<string, Signal<TData>[]>();
    for (const signal of signals) {
      const file = signal.location?.file;
      if (file === undefined) continue;
      const group = byFile.get(file);
      if (group) {
        group.push(signal);
      } else {
        byFile.set(file, [signal]);
      }
    }

    let winner: Signal<TData>[] = [];
    for (const group of byFile.values()) {
      if (group.length > winner.length) {
        winner = group;
      }
    }
    return winner;
  };
