import { Command } from "commander";
import type { ControlLoop } from "./control-loop";
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
      printApplyResult(await loop.applyPrComments(prNumber));
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
