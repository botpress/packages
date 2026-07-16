import type { SignalPriority } from "../types";
import type { SensorFn } from "./index";

export interface AstGrepMatch {
  file: string;
  /** 1-based, like Signal.location.line. */
  line: number;
  /** Source text of the matched node. */
  text: string;
}

export interface AstGrepOptions {
  /** ast-grep pattern, e.g. "console.log($$$ARGS)". */
  pattern: string;
  /** Language to parse, e.g. "typescript" or "tsx". Omit to let ast-grep infer it per file. */
  language?: string;
  /** Applied to every signal. Default "medium". */
  priority?: SignalPriority;
  /**
   * Builds the signal message for a match. Signals are matched across runs by
   * file + message, so keep it stable for a given anomaly. The default includes the
   * matched text, which naturally disappears once the anomaly is fixed.
   */
  message?: (match: AstGrepMatch) => string;
  /**
   * Paths (relative to the repo root) to scan. Required — scoping the scan keeps the
   * signal set intentional; pass ["."] to explicitly scan the whole repo.
   */
  paths: string[];
}

/**
 * Sensor that runs [ast-grep](https://ast-grep.github.io) inside the sandbox and turns
 * every structural match into a signal. The CLI is installed on first use if the
 * sandbox image doesn't have it (pre-bake `@ast-grep/cli` in a snapshot to skip that).
 *
 * @example
 * sensor: sensors.astGrep({
 *   pattern: "throw new Error($$$)",
 *   language: "ts",
 *   paths: ["packages/backend/src/trpc/routers/"],
 * })
 */
export const astGrep = (options: AstGrepOptions): SensorFn<AstGrepMatch> => {
  return async (repo) => {
    const install = await repo.exec("command -v ast-grep || npm install -g @ast-grep/cli", { timeoutSec: 600 });
    if (install.exitCode !== 0) {
      throw new Error(`failed to install ast-grep: ${install.output}`);
    }

    const lang = options.language ? ` --lang ${options.language}` : "";
    const paths = ` ${options.paths.map(shellQuote).join(" ")}`;
    const run = await repo.exec(`ast-grep run --pattern ${shellQuote(options.pattern)}${lang} --json${paths}`, {
      timeoutSec: 600,
    });
    if (run.exitCode !== 0) {
      throw new Error(`ast-grep exited ${run.exitCode}: ${run.output}`);
    }

    const results = JSON.parse(run.output) as Array<{
      file: string;
      text: string;
      range: { start: { line: number } };
    }>;

    return results.map((result) => {
      const match: AstGrepMatch = {
        file: result.file,
        line: result.range.start.line + 1,
        text: result.text,
      };
      return {
        location: { file: match.file, line: match.line },
        message: options.message?.(match) ?? defaultMessage(options.pattern, match),
        priority: options.priority ?? "medium",
        data: match,
      };
    });
  };
};

function defaultMessage(pattern: string, match: AstGrepMatch): string {
  const text = match.text.split("\n")[0]!.slice(0, 120);
  return `matches pattern "${pattern}": ${text}`;
}

/** Single-quote for the shell — ast-grep patterns are full of `$VAR`s the shell must not expand. */
function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
