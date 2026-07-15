import type { AgentContext } from "../agents";
import type { RunLog } from "../log";
import type { ControlLoopConfig, ControlLoopRunResult, Signal } from "../types";
import { claimMarker, signalKey } from "../claims";
import {
  REPO_PATH,
  SCRATCH_DIR,
  commitAll,
  memoryNote,
  readMemory,
  runConfiguredCommand,
} from "../sandbox";
import { Actuator } from "./actuator";
import type { ActuatorInput, InstructionBuilder } from "./index";
import { fromSignal } from "./instructions";

export interface AgentPrActuatorProps {
  /** Builds the agent's instructions per signal. Defaults to {@link fromSignal}. */
  instructions?: InstructionBuilder;
}

/**
 * The default actuator: for each picked signal it runs the configured coding agent, then
 * re-senses to verify the signal is gone (retrying up to `config.maxFixAttempts`), and
 * finally commits every fix to a fresh branch and opens one PR — claiming the signals it
 * fixed in the PR body so concurrent runs don't duplicate the work.
 *
 * This is the behavior the loop used to hard-code; it's now a swappable actuator.
 */
export class AgentPrActuator<TData = unknown> extends Actuator<TData> {
  private readonly instructions: InstructionBuilder;

  constructor(props: AgentPrActuatorProps = {}) {
    super();
    this.instructions = props.instructions ?? fromSignal();
  }

  async act(input: ActuatorInput<TData>): Promise<ControlLoopRunResult<TData>> {
    const { signals: picked, sandbox, ctx, sense, config, log, label, displayLabel } = input;

    const prefix = (config.branchPrefix ?? "control-loop").replace(/\/+$/, "");
    const branch = `${prefix}/${label}-${Date.now().toString(36)}`;
    await log.step(`checking out branch ${branch}`, async () => {
      await sandbox.git.createBranch(REPO_PATH, branch);
      await sandbox.git.checkoutBranch(REPO_PATH, branch);
    });

    await log.step("preparing agent", () => config.agent.prepare(ctx));

    const memory = await readMemory(ctx, label);
    const unresolved = await this.runFixLoop(picked, ctx, sense, memory, log, config);
    if (unresolved.length > 0) {
      log.finish(`fix failed — ${unresolved.length} signal(s) still present`);
      return { status: "fix-failed", unresolved };
    }

    // The scratch dir holds prompts and sensor scripts; it must not end up in the PR.
    await ctx.exec(`rm -rf ${SCRATCH_DIR}`);
    await runConfiguredCommand("preCommit", config, ctx, log);
    await log.step("committing & pushing", async () => {
      await commitAll(ctx, prTitle(displayLabel, picked));
      await config.git.push(sandbox, REPO_PATH, branch);
    });

    const prUrl = await log.step("opening pull request", () =>
      config.git.openPr({
        branch,
        label,
        title: prTitle(displayLabel, picked),
        body: prBody(displayLabel, picked),
      }),
    );
    log.finish(`PR opened → ${prUrl}`);
    return { status: "pr-opened", prUrl, fixed: picked };
  }

  /**
   * Runs the agent on each signal, then re-senses to verify. Signals still reported
   * by the sensor get retried (with a nudge appended) up to maxFixAttempts times.
   */
  private async runFixLoop(
    picked: Signal<TData>[],
    ctx: AgentContext,
    sense: () => Promise<Signal<TData>[]>,
    memory: string | undefined,
    log: RunLog,
    config: ControlLoopConfig,
  ): Promise<Signal<TData>[]> {
    const maxAttempts = config.maxFixAttempts ?? 3;
    let remaining = picked;
    let iteration = 0;

    for (let attempt = 1; attempt <= maxAttempts && remaining.length > 0; attempt++) {
      for (const signal of remaining) {
        const { instructions } = await this.instructions(signal);
        const retryNote =
          attempt === 1
            ? ""
            : "\n\nA previous attempt did not resolve this issue — the sensor still reports it. Look again and try a different approach.";
        const where = signalWhere(signal) || signal.message;
        iteration++;
        await log.step(`agent fixing ${where} (iteration ${iteration})`, () =>
          config.agent.executeAgent(instructions + retryNote + memoryNote(memory), ctx),
        );
      }

      const stillPresent = new Set((await log.step("re-sensing to verify", sense)).map(signalKey));
      remaining = remaining.filter((signal) => stillPresent.has(signalKey(signal)));
    }

    return remaining;
  }
}

/** "file:line", "file", or "" — the human-readable location of a signal, if it has one. */
function signalWhere(signal: Signal): string {
  const { location } = signal;
  if (!location) return "";
  return `${location.file}${location.line ? `:${location.line}` : ""}`;
}

function prTitle(label: string, fixed: Signal[]): string {
  return fixed.length === 1 ? `fix: ${fixed[0]!.message}` : `fix: ${label}: ${fixed.length} issues`;
}

function prBody(label: string, fixed: Signal[]): string {
  const lines = fixed.map((signal) => {
    const where = signalWhere(signal);
    const priority = signal.priority ? ` (${signal.priority})` : "";
    return `- ${where ? `\`${where}\` — ` : ""}${signal.message}${priority}`;
  });
  return [
    `Automated fix opened by the **${label}** control loop.`,
    "",
    "Signals resolved (verified by re-running the sensor):",
    ...lines,
    "",
    claimMarker(fixed),
  ].join("\n");
}
