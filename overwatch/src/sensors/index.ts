import type { RepoHandle } from "../repo-handle";
import type { Signal } from "../types";

/**
 * A sensor that runs on the host but reads the repo through a {@link RepoHandle}
 * proxying into the sandbox. Closures and imports work normally.
 */
export type SensorFn<TData = unknown> = (repo: RepoHandle) => Promise<Signal<TData>[]>;

/**
 * A sensor that is a standalone script uploaded into the sandbox and executed there
 * with the repo root as cwd. Create one with `sensors.script`.
 */
export interface SensorScript<TData = unknown> {
  kind: "sensor-script";
  /** Path on the host to a script whose default export is `() => Promise<Signal[]>`. */
  localPath: string;
  /**
   * Phantom marker for the `data` type the script's signals carry. A script runs in the
   * sandbox, so its data type can't be inferred from the file — set it explicitly with
   * `sensors.script<MyData>(path)` to type the paired actuator. Never populated at runtime.
   */
  readonly __data?: TData;
}

export type Sensor<TData = unknown> = SensorFn<TData> | SensorScript<TData>;

export { script } from "./script";
export { grep, type GrepOptions } from "./grep";
export { astGrep, type AstGrepOptions, type AstGrepMatch } from "./ast-grep";
export { reactDoctor, type ReactDoctorOptions, type ReactDoctorDiagnostic } from "./react-doctor";
