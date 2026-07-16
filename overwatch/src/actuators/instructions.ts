import { readFile } from "node:fs/promises";
import type { Signal } from "../types";
import type { InstructionBuilder } from "./index";

/**
 * Instruction builder that reads a local file (markdown, plain text, ...) and uses its
 * contents as the instructions for every signal, with the signal's details appended. The
 * file is read once per process and cached.
 */
export const fromFile = (localPath: string): InstructionBuilder => {
  let cached: string | undefined;
  return async (signal) => {
    cached ??= await readFile(localPath, "utf-8");
    const where = signal.location
      ? `In ${signal.location.file}${signal.location.line ? ` around line ${signal.location.line}` : ""}: \n`
      : "";
    return {
      instructions: `${where}${cached.trimEnd()}\n\n${signalContext(signal)}`,
    };
  };
};

/** Minimal instruction builder: instructions built from the signal itself, nothing else. */
export const fromSignal = (): InstructionBuilder => (signal) => ({
  instructions: [
    "Fix the following issue detected in this codebase. Make the smallest change that resolves it;",
    "do not fix unrelated issues or refactor unrelated code.",
    "",
    signalContext(signal),
  ].join("\n"),
});

function signalContext(signal: Signal): string {
  const lines = ["Issue to fix:"];
  if (signal.location) {
    const { file, line } = signal.location;
    lines.push(`- Location: ${line ? `${file}:${line}` : file}`);
  }
  lines.push(`- Description: ${signal.message}`);
  if (signal.priority) lines.push(`- Priority: ${signal.priority}`);
  return lines.join("\n");
}
