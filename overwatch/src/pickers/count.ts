import type { Signal } from "../types";
import type { Picker } from "./index";

/**
 * Default picker: takes the first `count` signals in sensor order.
 * Sort inside your sensor (or write your own picker) to prioritize differently.
 */
export const count =
  <TData = unknown>(count: number): Picker<TData> =>
  (signals: Signal<TData>[]) =>
    signals.slice(0, count);
