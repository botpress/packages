import { Command } from "commander";
import type { ControlLoop } from "./control-loop";
import type { LoopOrchestrator } from "./orchestrator";
import type { ApplyCommentsResult, ControlLoopRunResult } from "./types";

/**
 * Builds and runs the loop's built-in CLI. Exposed as `loop.cli()` — see that method for
 * the intended usage. Kept in its own module so `control-loop.ts` doesn't carry the
 * command-parsing and output-formatting weight.
 *
 * The `run` command exits non-zero when a fix couldn't be verified (`fix-failed`), so a CI
 * job surfaces it; any thrown error also exits non-zero. Every other outcome exits zero.
 */
export async function runCli<TData>(
  loop: ControlLoop<TData>,
  meta: { name: string; description: string },
  argv: string[] = process.argv,
): Promise<void> {
  const program = new Command();
  program.name(meta.name).description(meta.description).showHelpAfterError();

  program
    .command("run")
    .description("Run one full cycle: sense → pick → actuate (the default actuator opens a PR).")
    .action(async () => {
      const result = await loop.run();
      printRunResult(result);
      if (result.status === "fix-failed") process.exitCode = 1;
    });

  program
    .command("apply-comments")
    .description("Apply new review comments on a PR to its branch and push the fix in place.")
    .argument("<pr>", "number of the pull request to read new comments from")
    .action(async (pr: string) => {
      const prNumber = Number(pr);
      if (!Number.isInteger(prNumber) || prNumber <= 0) {
        throw new Error(`expected a positive PR number, got "${pr}"`);
      }
      const result = await loop.applyPrComments(prNumber);
      printApplyResult(result);
      if (result.status === "wrong-loop") process.exitCode = 1;
    });

  program.addHelpText(
    "after",
    `\nExamples:\n  $ ${meta.name} run\n  $ ${meta.name} apply-comments 1234\n`,
  );

  // No subcommand → show help rather than silently doing nothing.
  if (argv.slice(2).length === 0) {
    program.outputHelp();
    return;
  }

  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

/**
 * Backs {@link LoopOrchestrator.run} — the multi-loop counterpart to {@link runCli}. A single
 * program fronts every registered loop, so one CI workflow can drive them all: `run <loop>` for
 * a scheduled cycle, `apply-comments <pr>` for a shared comment webhook, `list` to discover slugs.
 *
 * Exits non-zero on a thrown error, an unresolved fix (`fix-failed`), or a comment event that
 * matched no registered loop — so a mis-wired trigger fails loudly.
 */
export async function runOrchestratorCli(
  orchestrator: LoopOrchestrator,
  argv: string[] = process.argv,
): Promise<void> {
  const program = new Command();
  program
    .name("overwatch")
    .description("Drive several control loops from one entry point (runs and PR comment events).")
    .showHelpAfterError();

  program
    .command("run")
    .description("Run one full cycle of a registered loop, selected by its label slug.")
    .argument("<loop>", "label slug of the loop to run (see `list`)")
    .action(async (slug: string) => {
      const result = await orchestrator.runLoop(slug);
      printRunResult(result);
      if (result.status === "fix-failed") process.exitCode = 1;
    });

  program
    .command("apply-comments")
    .description("Route a PR comment event to the loop that owns the PR and apply new comments.")
    .argument("<pr>", "number of the pull request the comment event fired on")
    .action(async (pr: string) => {
      const prNumber = Number(pr);
      if (!Number.isInteger(prNumber) || prNumber <= 0) {
        throw new Error(`expected a positive PR number, got "${pr}"`);
      }
      const dispatch = await orchestrator.applyPrComments(prNumber);
      if (dispatch.status === "no-matching-loop") {
        console.log(`no registered loop owns PR #${dispatch.prNumber} — nothing applied`);
        process.exitCode = 1;
        return;
      }
      console.log(`→ ${dispatch.loop}`);
      printApplyResult(dispatch.result);
    });

  program
    .command("list")
    .description("List the registered loops and the label slugs they route on.")
    .action(() => {
      const loops = orchestrator.list();
      if (loops.length === 0) {
        console.log("no loops registered");
        return;
      }
      for (const { slug, label } of loops) console.log(`${slug}  —  ${label}`);
    });

  program.addHelpText(
    "after",
    `\nExamples:\n  $ overwatch list\n  $ overwatch run react-doctor-issues\n  $ overwatch apply-comments 1234\n`,
  );

  if (argv.slice(2).length === 0) {
    program.outputHelp();
    return;
  }

  try {
    await program.parseAsync(argv);
  } catch (error) {
    console.error(`error: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

function printRunResult(result: ControlLoopRunResult): void {
  switch (result.status) {
    case "skipped":
      console.log(`skipped: ${result.reason}`);
      break;
    case "clean":
      console.log("clean — no signals to act on");
      break;
    case "fix-failed":
      console.log(
        `fix failed — ${result.unresolved.length} signal(s) still present after all attempts`,
      );
      break;
    case "pr-opened":
      console.log(`PR opened: ${result.prUrl} (${result.fixed.length} signal(s) fixed)`);
      break;
  }
}

function printApplyResult(result: ApplyCommentsResult): void {
  switch (result.status) {
    case "wrong-loop":
      console.log(
        `PR is not labeled "${result.label}" (labels: ${result.labels.join(", ") || "none"}) — ` +
          `not this loop's PR, nothing applied`,
      );
      break;
    case "no-new-comments":
      console.log("no comments newer than the PR head — nothing to apply");
      break;
    case "no-changes":
      console.log(`applied ${result.comments.length} comment(s) — the agent left the tree untouched`);
      break;
    case "comments-applied":
      console.log(`applied ${result.comments.length} comment(s) → pushed to ${result.branch}`);
      break;
  }
}
