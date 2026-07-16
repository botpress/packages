/**
 * Tiny, dependency-free run logger. It narrates — to stderr — what a control-loop run
 * is doing to its sandbox, so you can see where the sandbox is at each step. stderr is
 * used so it never mixes with a caller that parses the loop's return value off stdout.
 *
 * Muted with CONTROL_LOOP_SILENT=1; colors follow NO_COLOR and TTY detection.
 */

const enabled = process.env.CONTROL_LOOP_SILENT !== "1" && process.env.CONTROL_LOOP_SILENT !== "true";
const color = enabled && Boolean(process.stderr.isTTY) && !process.env.NO_COLOR;

const paint = (code: string) => (text: string) => (color ? `\x1b[${code}m${text}\x1b[0m` : text);
const dim = paint("2");
const bold = paint("1");
const cyan = paint("36");
const green = paint("32");
const yellow = paint("33");
const red = paint("31");
const magenta = paint("35");

function elapsed(startMs: number): string {
  const ms = Date.now() - startMs;
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/** Placeholder scope shown before the sandbox exists (nothing to point at yet). */
const PENDING = "········";

export class RunLog {
  private scope = PENDING;

  constructor(label: string) {
    if (!enabled) return;
    process.stderr.write(`\n${dim("━━")} ${bold("control-loop")} ${dim("·")} ${cyan(label)}\n`);
  }

  /** Once the sandbox exists, tag every subsequent line with its (short) id. */
  attach(sandboxId: string): void {
    this.scope = sandboxId.slice(0, 8);
    this.line(magenta("◆"), `sandbox ${bold(this.scope)} ready`);
  }

  /** Wraps an async op: prints "→ label", then "✓ label (elapsed)" — or "✗ label" if it throws. */
  async step<T>(label: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    this.line(cyan("→"), label);
    try {
      const result = await fn();
      this.line(green("✓"), `${label} ${dim(`(${elapsed(start)})`)}`);
      return result;
    } catch (error) {
      this.line(red("✗"), `${label} ${dim(`(${elapsed(start)})`)}`);
      throw error;
    }
  }

  /** A neutral status line — counts, picks, and other in-between context. */
  info(message: string): void {
    this.line(dim("·"), dim(message));
  }

  /** The run bowed out early (nothing to do, cap hit). */
  skip(message: string): void {
    this.line(yellow("⏭"), yellow(message));
  }

  /** The run's terminal outcome. */
  finish(message: string): void {
    this.line(green("●"), bold(message));
  }

  private line(symbol: string, message: string): void {
    if (!enabled) return;
    process.stderr.write(`  ${dim(this.scope)}  ${symbol} ${message}\n`);
  }
}
