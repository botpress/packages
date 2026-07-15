import type { GrepMatch } from "../repo-handle";
import type { SignalPriority } from "../types";
import type { SensorFn } from "./index";

export interface GrepOptions {
  /** Text/regex pattern searched in file contents. */
  pattern: string;
  /**
   * Paths (relative to the repo root) to search. Required — scoping the search keeps
   * the signal set intentional; pass ["."] to explicitly search the whole repo.
   */
  paths: string[];
  /** Applied to every signal. Default "medium". */
  priority?: SignalPriority;
  /**
   * Builds the signal message for a match. Signals are matched across runs by
   * file + message, so keep it stable for a given anomaly. The default includes the
   * matched line, which naturally disappears once the anomaly is fixed.
   */
  message?: (match: GrepMatch) => string;
}

/**
 * Sensor that searches file contents and turns every matching line into a signal.
 *
 * @example
 * sensor: sensors.grep({
 *   pattern: "TODO:",
 *   paths: ["src/"],
 *   message: (match) => `unresolved TODO: ${match.content.trim()}`,
 * })
 */
export const grep = (options: GrepOptions): SensorFn<GrepMatch> => {
  return async (repo) => {
    const matches = await repo.grep(options.pattern, options.paths);
    return matches.map((match) => ({
      location: { file: match.file, line: match.line },
      message: options.message?.(match) ?? `matches "${options.pattern}": ${match.content.trim().slice(0, 120)}`,
      priority: options.priority ?? "medium",
      data: match,
    }));
  };
};
