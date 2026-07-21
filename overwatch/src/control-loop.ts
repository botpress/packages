import { Daytona, type Sandbox } from "@daytona/sdk";
import type { AgentContext } from "./agents";
import type { PrComment } from "./github";
import { RepoHandle } from "./repo-handle";
import { RunLog } from "./log";
import * as actuators from "./actuators";
import * as pickers from "./pickers";
import { runCli } from "./cli";
import { parseClaimedKeys, signalKey } from "./claims";
import {
  REPO_PATH,
  SCRATCH_DIR,
  appendMemory,
  commitAll,
  memoryNote,
  readMemory,
  runConfiguredCommand,
} from "./sandbox";
import type { Sensor } from "./sensors";
import type {
  ApplyCommentsResult,
  ControlLoopConfig,
  ControlLoopOptions,
  ControlLoopRunResult,
  Signal,
} from "./types";

export class ControlLoop<TData = unknown> {
  constructor(private readonly options: ControlLoopOptions<TData>) {}

  /** The human-readable label this loop was constructed with. */
  get label(): string {
    return this.options.label;
  }

  /**
   * Slug applied to every PR this loop opens (see {@link ControlLoopOptions.label}). It's the
   * loop's identity for claim-matching and, under a {@link LoopOrchestrator}, the key comment
   * events route on — so it must be unique across loops sharing an orchestrator.
   */
  get labelSlug(): string {
    return slugify(this.options.label);
  }

  /**
   * Executes one full cycle: sense -> pick -> run actuator -> verify -> PR.
   * Invoke this from whatever scheduler you use (cron, CI); the loop itself
   * does not stay resident.
   */
  async run(): Promise<ControlLoopRunResult<TData>> {
    const { config, sensor, picker } = this.options;
    const label = slugify(this.options.label);
    const log = new RunLog(this.options.label);

    const maxOpenPrCount = config.maxOpenPrCount;
    if (maxOpenPrCount !== undefined) {
      const openPrCount = await config.git.countOpenPrs(label);
      if (openPrCount >= maxOpenPrCount) {
        const reason = `${openPrCount} open PR(s) labeled "${label}" (max ${maxOpenPrCount})`;
        log.skip(reason);
        return { status: "skipped", reason };
      }
    }

    return this.withProvisionedSandbox(log, async (sandbox, ctx) => {
      const sense = makeSensorRunner(sensor, sandbox, ctx);

      const sensed = await log.step("sensing for signals", sense);
      if (sensed.length === 0) {
        log.finish("clean — no signals detected");
        return { status: "clean" };
      }
      log.info(`sensed ${sensed.length} signal(s)`);

      // Signals already claimed by an open PR of this loop are excluded, so concurrent
      // runs don't fix the same thing twice while earlier PRs await merge.
      const claimed = new Set(
        (await config.git.listOpenPrBodies(label)).flatMap(parseClaimedKeys),
      );
      const signals = sensed.filter((signal) => !claimed.has(signalKey(signal)));
      if (signals.length < sensed.length) {
        log.info(`${sensed.length - signals.length} signal(s) already claimed by open PRs`);
      }
      if (signals.length === 0) {
        log.finish("all sensed signals are already claimed by open PRs");
        return { status: "skipped", reason: "all sensed signals are claimed by open PRs" };
      }

      const picked = await (picker ?? pickers.count<TData>(1))(signals);
      if (picked.length === 0) {
        log.finish("clean — picker selected nothing");
        return { status: "clean" };
      }
      log.info(`picked ${picked.length} of ${signals.length} signal(s) to act on`);

      // The actuator owns everything past this point — what to do with the picked
      // signals and how to report the outcome. The default `AgentPrActuator` runs the
      // agent per signal and opens a PR; other actuators may do neither.
      return this.options.actuator.act({
        signals: picked,
        sandbox,
        ctx,
        sense,
        config,
        label,
        displayLabel: this.options.label,
        log,
      });
    });
  }

  /**
   * Creates a sandbox, clones `branch` (default: the base branch), configures git, and
   * runs the `setup` hook — the provisioning every entry point shares — then invokes `fn`
   * with the ready sandbox and its {@link AgentContext}. The sandbox is always torn down
   * afterward, including when provisioning or `fn` throws.
   */
  private async withProvisionedSandbox<T>(
    log: RunLog,
    fn: (sandbox: Sandbox, ctx: AgentContext) => Promise<T>,
    branch?: string,
  ): Promise<T> {
    const { config } = this.options;
    const sandbox = await log.step("spinning up sandbox", () => createSandbox(config));
    log.attach(sandbox.id);

    try {
      await log.step(`cloning ${branch ?? config.git.branch} into ${REPO_PATH}`, async () => {
        await config.git.cloneInto(sandbox, REPO_PATH, branch);
        const { name, email } = await config.git.committer();
        await sandbox.git.configureUser(name, email, "local", REPO_PATH);
      });

      const ctx = makeAgentContext(sandbox);
      await ctx.exec(`mkdir -p ${SCRATCH_DIR}`);

      await runConfiguredCommand("setup", config, ctx, log);

      return await fn(sandbox, ctx);
    } finally {
      await log.step("tearing down sandbox", () => sandbox.delete());
    }
  }

  /**
   * Provisions a sandbox the way {@link run} does up through the `setup` hook — clone,
   * configure git, run `config.hooks.setup` — then captures its filesystem as a Daytona
   * snapshot named `name` and returns, without sensing, touching the agent, or opening a
   * PR. Pass the same `name` as `config.sandbox.snapshot` on later runs so they start from
   * the baked-in toolchain instead of re-running `setup` every time.
   *
   * Call this instead of `run` (e.g. as a one-off provisioning step); `name` is required.
   */
  async saveSnapshot(name: string): Promise<void> {
    const log = new RunLog(this.options.label);

    await this.withProvisionedSandbox(log, async (sandbox, ctx) => {
      // The scratch dir is per-run bookkeeping (prompts, sensor scripts); keep it out of
      // the snapshot so it doesn't leak into runs created from it.
      await ctx.exec(`rm -rf ${SCRATCH_DIR}`);

      // 0 = no timeout: baking a real repo's toolchain can take well past the SDK's
      // 60-second default.
      await log.step(`saving snapshot ${name}`, () => sandbox._experimental_createSnapshot(name, 0));
      log.finish(`snapshot saved → ${name}`);
    });
  }

  /**
   * Handler for PR comment events: reads the comments left on the PR since its last
   * commit, has the agent apply them on the PR's branch, and pushes — updating the PR
   * in place. Wire this to your webhook (or poller) for PR comment activity.
   *
   * Comments older than the PR's head commit are treated as already addressed, which
   * makes repeated triggers for the same comment thread safe.
   */
  async applyPrComments(prNumber: number): Promise<ApplyCommentsResult> {
    const { config, commentActuator } = this.options;
    const label = slugify(this.options.label);
    const log = new RunLog(`${this.options.label} · PR #${prNumber}`);

    const pr = await config.git.getPr(prNumber);

    // A PR opened by this loop always carries its label (see `openPr` in github.ts, which
    // closes any PR it can't label). A PR without it belongs to another loop or a human, so
    // refuse it — otherwise we'd push this loop's agent config onto a foreign branch and
    // fold its `/feedback` into the wrong loop's memory. This runs before the sandbox is
    // provisioned, so a misfired trigger costs nothing.
    if (!pr.labels.includes(label)) {
      log.skip(`PR #${prNumber} is not labeled "${label}" — not this loop's PR`);
      return { status: "wrong-loop", label, labels: pr.labels };
    }

    const newComments = (await config.git.listPrComments(prNumber)).filter(
      (comment) => new Date(comment.createdAt) > new Date(pr.headCommittedAt),
    );
    if (newComments.length === 0) {
      log.skip("no comments newer than the PR head");
      return { status: "no-new-comments" };
    }

    // "/feedback ..." comments are applied to the PR like any other, but their text is
    // also persisted to the loop's memory file so every future run learns from them.
    // The prefix is stripped so the agent sees plain instructions.
    const comments = newComments.map((comment) =>
      isFeedback(comment) ? { ...comment, body: stripFeedbackPrefix(comment.body) } : comment,
    );
    const feedback = comments.filter((_, index) => isFeedback(newComments[index]!));
    log.info(`applying ${comments.length} new comment(s)`);

    return this.withProvisionedSandbox(
      log,
      async (sandbox, ctx) => {
        await log.step("preparing agent", () => config.agent.prepare(ctx));

        // Memory is read before appending, so the agent gets past feedback while the new
        // feedback reaches it through the comments themselves.
        const memory = await readMemory(ctx, label);
        if (feedback.length > 0) {
          await appendMemory(ctx, label, memory, feedback);
        }

        const { instructions } = await (commentActuator ?? actuators.prComments)(comments);
        await log.step("agent applying comments", () =>
          config.agent.executeAgent(instructions + memoryNote(memory), ctx),
        );

        await ctx.exec(`rm -rf ${SCRATCH_DIR}`);
        await runConfiguredCommand("preCommit", config, ctx, log);
        const status = await ctx.exec("git status --porcelain");
        if (status.output.trim() === "") {
          log.finish("no changes — agent left the tree untouched");
          return { status: "no-changes", comments };
        }

        await log.step("committing & pushing", async () => {
          await commitAll(ctx, "fix: address PR review comments");
          await config.git.push(sandbox, REPO_PATH, pr.branch);
        });
        log.finish(`comments applied to ${pr.branch}`);
        return { status: "comments-applied", branch: pr.branch, comments };
      },
      pr.branch,
    );
  }

  /**
   * Ready-made CLI for driving this loop from CI (or a shell). Declare the loop, then call
   * this once at the end of the file:
   *
   *     const loop = new ControlLoop({ ... });
   *     loop.cli();
   *
   * Two subcommands: `run` (one full cycle → {@link run}) and `apply-comments <pr>`
   * (apply new PR review comments → {@link applyPrComments}). Run with `--help` for usage.
   * Parses `process.argv` by default; the process exits non-zero on error or an unresolved
   * fix, so CI can gate on it.
   */
  cli(argv: string[] = process.argv): Promise<void> {
    return runCli(this, { name: slugify(this.options.label), description: this.options.label }, argv);
  }
}

/**
 * Every sandbox runs on a "high" machine: Daytona's default tier (1 vCPU / 1 GiB RAM
 * / 3 GiB disk) OOM-kills dependency installs on real repos (`setup` exiting 137),
 * and monorepo installs + an agent benefit from the extra headroom.
 */
const HIGH_RESOURCES = { cpu: 4, memory: 8, disk: 10 };

async function createSandbox(config: ControlLoopConfig): Promise<Sandbox> {
  // Reads DAYTONA_API_KEY / DAYTONA_API_URL / DAYTONA_TARGET from the environment.
  const daytona = new Daytona();

  if (config.sandbox?.snapshot) {
    // Daytona rejects resources when creating from a snapshot ("Cannot specify Sandbox
    // resources when using a snapshot") — a snapshot's resources are baked in, so give
    // yours a medium-or-bigger tier when creating it.
    return daytona.create({ snapshot: config.sandbox.snapshot, envVars: config.env });
  }

  // Resources can only be requested for image-based creation. daytonaio/sandbox is the
  // image behind Daytona's default snapshot (bun/node/git included); the built snapshot
  // is cached by Daytona, so this is only slow the very first time.
  return daytona.create(
    { image: "daytonaio/sandbox:latest", resources: HIGH_RESOURCES, envVars: config.env },
    { timeout: 300 },
  );
}

function makeAgentContext(sandbox: Sandbox): AgentContext {
  return {
    exec: async (command, options) => {
      const response = await sandbox.process.executeCommand(
        command,
        REPO_PATH,
        options?.env,
        options?.timeoutSec ?? 300,
      );
      return { exitCode: response.exitCode, output: response.result };
    },
    writeFile: async (path, content) => {
      await sandbox.fs.uploadFile(Buffer.from(content), `${REPO_PATH}/${path}`);
    },
  };
}

/**
 * Normalizes both sensor flavors into a re-runnable `() => Promise<Signal[]>`.
 *
 * Script sensors are uploaded into the repo's scratch dir and executed with bun, with
 * the repo root as cwd. The generated runner writes the signals to a JSON file rather
 * than stdout, so the user's script is free to log without corrupting the result.
 */
function makeSensorRunner<TData>(
  sensor: Sensor<TData>,
  sandbox: Sandbox,
  ctx: AgentContext,
): () => Promise<Signal<TData>[]> {
  if (typeof sensor === "function") {
    const repo = new RepoHandle(sandbox, REPO_PATH);
    return () => sensor(repo);
  }

  const extension = sensor.localPath.endsWith(".js") ? ".js" : ".ts";
  const scriptPath = `${SCRATCH_DIR}/sensor${extension}`;
  const signalsPath = `${SCRATCH_DIR}/signals.json`;
  let prepared = false;

  return async () => {
    if (!prepared) {
      await sandbox.fs.uploadFile(sensor.localPath, `${REPO_PATH}/${scriptPath}`);
      await ctx.writeFile(
        `${SCRATCH_DIR}/run-sensor.ts`,
        `import { writeFileSync } from "node:fs";\n` +
          `const mod = await import("./sensor${extension}");\n` +
          `const signals = await mod.default();\n` +
          `writeFileSync("${signalsPath}", JSON.stringify(signals));\n`,
      );
      const bun = await ctx.exec("command -v bun || npm install -g bun", { timeoutSec: 600 });
      if (bun.exitCode !== 0)
        throw new Error(`failed to install bun for the sensor script: ${bun.output}`);
      prepared = true;
    }

    const run = await ctx.exec(`bun ${SCRATCH_DIR}/run-sensor.ts`, { timeoutSec: 600 });
    if (run.exitCode !== 0) throw new Error(`sensor script exited ${run.exitCode}: ${run.output}`);
    const raw = await sandbox.fs.downloadFile(`${REPO_PATH}/${signalsPath}`);
    return JSON.parse(raw.toString("utf-8")) as Signal<TData>[];
  };
}

function isFeedback(comment: PrComment): boolean {
  return comment.body.trimStart().startsWith("/feedback");
}

function stripFeedbackPrefix(body: string): string {
  return body.trimStart().replace(/^\/feedback\s*/, "");
}

function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
