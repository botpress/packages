import type { SensorScript } from "./index";

/**
 * Sensor that is a standalone local script uploaded into the sandbox and executed
 * there with the repo root as cwd. The file's default export must be
 * `() => Promise<Signal[]>`.
 */
export const script = <TData = unknown>(localPath: string): SensorScript<TData> => ({
  kind: "sensor-script",
  localPath,
});
