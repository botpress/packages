import type { SignalPriority } from "../types";
import type { SensorFn } from "./index";

/** One react-doctor finding, as emitted by `react-doctor --json`. */
export interface ReactDoctorDiagnostic {
  filePath: string;
  plugin: string;
  rule: string;
  severity: string;
  title?: string;
  message: string;
  help?: string;
  /** 1-based; 0 means the finding is file-level. */
  line: number;
  column?: number;
  category?: string;
}

export interface ReactDoctorOptions {
  /**
   * Directory (relative to the repo root) to scan. Required — scoping the scan keeps
   * the signal set intentional; pass "." to explicitly scan the whole repo.
   */
  path: string;
  /** Only report these categories (e.g. ["Performance", "Bugs"]). Default: all. */
  categories?: string[];
  /**
   * Builds the signal message for a diagnostic. Signals are matched across runs by
   * file + message, so keep it stable for a given anomaly. The default combines the
   * rule with react-doctor's message.
   */
  message?: (diagnostic: ReactDoctorDiagnostic) => string;
}

/**
 * Sensor that runs [react-doctor](https://react.doctor) inside the sandbox and turns
 * every diagnostic into a signal. Severity maps to priority (error -> high,
 * warning -> medium, else low); the full diagnostic (including react-doctor's `help`
 * text, useful in an actuator's instructions) rides along in `data`.
 *
 * @example
 * sensor: sensors.reactDoctor({
 *   path: "packages/frontend",
 *   categories: ["Performance", "Bugs"],
 * })
 */
export const reactDoctor = (options: ReactDoctorOptions): SensorFn<ReactDoctorDiagnostic> => {
  return async (repo) => {
    const output = "/tmp/react-doctor.json";
    const categories = (options.categories ?? [])
      .map((category) => ` --category ${shellQuote(category)}`)
      .join("");
    // react-doctor exits 1 whenever it finds issues, so success is judged from the
    // JSON (`ok`), not the exit code. stdout goes through a file to keep it parseable
    // even if bunx prints installation noise.
    const run = await repo.exec(
      `bunx -y react-doctor@latest ${shellQuote(options.path)} --json --no-analytics${categories} > ${output} 2>/dev/null; cat ${output}`,
      { timeoutSec: 900 },
    );

    type Report = {
      ok: boolean;
      directory: string;
      projects?: Array<{ directory: string; diagnostics?: ReactDoctorDiagnostic[] }>;
    };
    let report: Report;
    try {
      report = JSON.parse(run.output) as Report;
    } catch {
      throw new Error(`react-doctor produced unparseable output: ${run.output.slice(0, 500)}`);
    }
    if (!report.ok) {
      throw new Error(`react-doctor failed: ${run.output.slice(0, 500)}`);
    }

    return (report.projects ?? []).flatMap((project) => {
      // filePath is relative to the project directory; rebuild a repo-relative path
      // (scan path + project dir within the scan root + filePath) for the signal's file.
      const projectRelative = project.directory.slice(report.directory.length);
      const prefix = joinPaths(options.path, projectRelative);
      return (project.diagnostics ?? []).map((diagnostic) => ({
        location: {
          file: joinPaths(prefix, diagnostic.filePath),
          line: diagnostic.line > 0 ? diagnostic.line : undefined,
        },
        message:
          options.message?.(diagnostic) ??
          `react-doctor ${diagnostic.rule}: ${diagnostic.message}`,
        priority: reactDoctorPriority(diagnostic.severity),
        data: diagnostic,
      }));
    });
  };
};

function reactDoctorPriority(severity: string): SignalPriority {
  if (severity === "error") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

function joinPaths(...parts: string[]): string {
  return parts
    .map((part) => part.replace(/^[./]+|\/+$/g, ""))
    .filter((part) => part !== "")
    .join("/");
}

/** Single-quote for the shell; category names and paths are arbitrary user text. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
