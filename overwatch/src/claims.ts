import type { Signal } from "./types";

/** Signals are matched across sensor runs by file + message; line numbers shift after edits. */
export function signalKey(signal: Signal): string {
  return `${signal.location?.file ?? ""} ${signal.message}`;
}

/**
 * Open PRs "claim" the signals they fix via an invisible marker in their body, so
 * concurrent runs (maxOpenPrCount > 1) don't fix the same signals twice while earlier
 * PRs are still unmerged. A merged PR removes the signals at the source (the sensor
 * stops reporting them); a closed-unmerged PR releases its claims automatically.
 *
 * The write half (`claimMarker`) lives with the PR-opening actuator; the read half
 * (`parseClaimedKeys`) is used by the loop when filtering sensed signals — both share
 * the marker string, so they stay in this one file.
 */
export const CLAIM_MARKER = "control-loop:claimed-signals";

export function claimMarker(signals: Signal[]): string {
  return `<!-- ${CLAIM_MARKER} ${JSON.stringify(signals.map(signalKey))} -->`;
}

export function parseClaimedKeys(body: string): string[] {
  const match = body.match(new RegExp(`<!-- ${CLAIM_MARKER} (\\[.*?\\]) -->`, "s"));
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[1]!) as unknown;
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === "string") : [];
  } catch {
    return [];
  }
}
