# Overwatch

A headless library for building **control loops**: scheduled bots that scan a repo for one
class of anomaly, fix a few instances with a coding agent, and open a PR. There's no server or
UI — you call `loop.run()` from whatever scheduler you already have (cron, CI, a serverless
handler), and each call does one full cycle:

```
sense → filter claimed → pick → actuator acts
                                 └─ default: agent per signal → verify (re-sense) → commit → PR
```

Everything runs inside a fresh [Daytona](https://daytona.io) sandbox: the repo is cloned in,
an agent CLI (Claude Code or Codex) is installed and driven non-interactively, and the sandbox
is torn down at the end of the run.

## Install

```bash
pnpm add @bpinternal/overwatch     # or: npm install / yarn add
```

Ships as a compiled build (CommonJS, with type declarations) that works from both `require` and
`import` on Node 18+. To hack on the library itself, clone the repo and run `pnpm install`
(pnpm is the supported package manager; the version is pinned via `packageManager`).

You'll need, at minimum:

- `DAYTONA_API_KEY` (and optionally `DAYTONA_API_URL` / `DAYTONA_TARGET`) — sandbox creation
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` — whichever agent you use
- A GitHub token with push + PR permissions on the target repo, if you want the loop to open
  PRs rather than just report

## Quick start

```ts
import { ControlLoop, Github, Codex, AgentPrActuator, sensors } from "@bpinternal/overwatch";

const loop = new ControlLoop({
  // Slugified and applied as a label on every PR this loop opens; also what
  // config.maxOpenPrCount counts against.
  label: "Naked Error Should be ServiceError",

  config: {
    maxOpenPrCount: 1,
    git: new Github({
      repo: "https://github.com/my-org/my-repo.git",
      branch: "main",
      key: process.env.GITHUB_TOKEN,
    }),
    agent: new Codex({ apiKey: process.env.OPENAI_API_KEY!, model: "gpt-5.5" }),
    hooks: {
      setup: "bun install",
      preCommit: "bun run fix:format",
    },
  },

  // Detects anomalies. Scans src/ for raw `throw new Error(...)`.
  sensor: sensors.astGrep({
    pattern: "throw new Error($$$)",
    language: "ts",
    paths: ["src/"],
  }),

  // The actuator decides what to do with the picked signals. The default AgentPrActuator
  // runs the agent per signal, verifies by re-sensing, then commits and opens a PR. Its
  // `instructions` builder turns one signal into the agent's prompt — see "Writing a
  // custom actuator" below for the built-in builders and for how to swap in an actuator
  // that does something other than open a PR.
  actuator: new AgentPrActuator({
    instructions: (signal) => ({
      instructions: [
        `Fix this in ${signal.location?.file ?? "the codebase"}.`,
        `Issue: ${signal.message}`,
        "Make the smallest change that resolves it — no unrelated refactors.",
      ].join("\n"),
    }),
  }),
});

// Expose the built-in CLI (see "Running from CI" below). Or call loop.run() directly.
loop.cli();
```

Run it with your TypeScript runner — e.g. `pnpm dlx tsx my-loop.ts run` — on whatever cadence
you like (a cron trigger, a GitHub Action on a schedule, etc.); the loop itself doesn't stay
resident between runs.

See `examples/` for fuller, realistic configurations (shared config in `examples/common.ts`,
loops built on top of it).

## Running from CI

A loop is a plain script, so any TypeScript runner can run it. Rather than wiring up argument
handling yourself, end the file with **`loop.cli()`** — it turns the script into a small
command-line tool with two subcommands:

```ts
const loop = new ControlLoop({ /* ... */ });

loop.cli(); // parses process.argv and runs the matching subcommand
```

```bash
tsx my-loop.ts run                    # one full cycle: sense → pick → actuate (→ PR)
tsx my-loop.ts apply-comments 1234    # apply new review comments on PR #1234, push in place
tsx my-loop.ts --help                 # usage (works on each subcommand too)
```

- **`run`** exits **non-zero** if a fix couldn't be verified (`fix-failed`) or on any thrown
  error, so a CI step fails loudly. Every other outcome — `clean`, `skipped`, `pr-opened` —
  exits `0`. The result is also printed as a one-line summary.
- **`apply-comments <pr>`** reads comments newer than the PR's head commit and applies them to
  the PR's branch (see **PR review comments** above). Wire it to a `pull_request_review_comment`
  trigger, passing the PR number.

Help and argument parsing are handled by [commander](https://github.com/tj/commander.js), so
`--help`, unknown-command errors, and per-command usage all come for free.

A GitHub Actions workflow that runs the loop hourly and handles review comments as they land:

```yaml
name: control-loop
on:
  schedule:
    - cron: "0 * * * *"           # hourly
  pull_request_review_comment:
    types: [created]

jobs:
  loop:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install
      - name: run
        if: github.event_name == 'schedule'
        run: pnpm dlx tsx my-loop.ts run
        env:
          DAYTONA_API_KEY: ${{ secrets.DAYTONA_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GH_PUSH_TOKEN }}
      - name: apply review comments
        if: github.event_name == 'pull_request_review_comment'
        run: pnpm dlx tsx my-loop.ts apply-comments ${{ github.event.pull_request.number }}
        env:
          DAYTONA_API_KEY: ${{ secrets.DAYTONA_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GH_PUSH_TOKEN }}
```

Pass `config.maxOpenPrCount` to keep a scheduled `run` from piling up PRs faster than they merge.

## Core concepts

A control loop is five pieces of configuration wired into `ControlLoop`:

| Piece | Type | Purpose |
| --- | --- | --- |
| `sensor` | `Sensor` | Scans the repo, returns `Signal[]` — the anomalies found |
| `picker` | `Picker` (optional) | Chooses which signals to act on *this run* |
| `actuator` | `Actuator` | Acts on the picked signals; the default runs the agent and opens a PR |
| `config.agent` | `Agent` | Drives a coding agent CLI inside the sandbox |
| `config.git` | `GitSource` | Where to clone from, where to push and open the PR |

A **`Signal`** is the unit everything else operates on:

```ts
interface Signal<TData = unknown> {
  // Where the anomaly is. Optional — some anomalies are repo-wide. When present,
  // `location.file` anchors the signal's identity (see below).
  location?: { file: string; line?: number };
  message: string;
  priority?: "low" | "medium" | "high";
  data?: TData; // anything sensor-specific; carried through to picker and actuator untouched
}
```

Signals are matched across runs by **`location.file + message` only** — `line` is informational and
naturally shifts as fixes land, so never bake a line number or timestamp into `message`. This
identity is what lets the loop tell "still broken, retry" from "fixed" during verification, and
what lets it skip signals an already-open PR has claimed.

### What one `run()` does, in order

1. Skip early if `config.maxOpenPrCount` open PRs already carry this loop's label.
2. Spin up a sandbox, clone the repo, run `config.hooks.setup`.
3. Run the sensor. No signals → done (`status: "clean"`).
4. Drop signals already claimed by another open PR of this loop (see **Memory & claiming**
   below).
5. Run the picker (default: `pickers.count(1)`, i.e. the first signal in sensor order). No
   signals picked → done.
6. Hand the picked signals to `actuator.act(...)` and return whatever it reports. Steps 6a–6c
   below are what the **default `AgentPrActuator`** does — a different actuator owns this step
   entirely and may do none of them:
   - **6a.** Check out a branch, run the agent once per picked signal using that signal's
     instructions, then re-run the sensor to check which signals are gone. Anything still
     present is retried (with a "try a different approach" nudge) up to `config.maxFixAttempts`
     times (default 3).
   - **6b.** If anything's still unresolved after all attempts → `status: "fix-failed"`,
     nothing is pushed.
   - **6c.** Otherwise: run `config.hooks.preCommit`, commit everything with `--no-verify`,
     push, open the PR (labeled, with a claim marker in the body) → `status: "pr-opened"`.

`run()` resolves to a `ControlLoopRunResult` — always check `.status` rather than assuming
success; a clean sensor pass and a "we tried and failed" pass are both normal outcomes, not
exceptions.

### PR review comments

`loop.applyPrComments(prNumber)` is the other entry point — wire it to your GitHub webhook (or
poll for it) for comment activity on PRs the loop opened. It fetches comments newer than the
PR's head commit, has the agent apply them on the PR's existing branch, and pushes in place.
Comments older than the head are treated as already addressed, so re-triggering on the same
thread is safe (`status: "no-new-comments"`).

A comment starting with `/feedback` is applied like any other comment, but its text (prefix
stripped) is also persisted into `.github/control-loop/memory-<label>.md` in the repo. That
file is read on every future run of the same loop and appended to every agent instruction as
standing guidance — this is how you correct a loop's behavior once and have it stick, since the
memory file ships with the PR that recorded it.

### Claiming (safe concurrency)

Every opened PR embeds an invisible marker listing the signal keys it fixes. On the next run,
signals already claimed by an *open* PR of the same loop are excluded before picking — so
running the loop again before a previous PR merges won't produce a duplicate fix for the same
issue. A merged PR removes the signal at the source (the sensor stops reporting it); a
closed-without-merging PR releases its claim automatically since it's no longer open.

## Writing a custom sensor

A sensor is either a plain function or a script uploaded into the sandbox. Use `sensors.*` for
common cases; write your own when they don't fit.

**Host-side function** (`SensorFn`) — runs on your machine/CI runner, with a `RepoHandle` that
proxies `exec`, `readFile`, `glob`, and `grep` into the sandbox:

```ts
import type { RepoHandle } from "@bpinternal/overwatch";
import type { Signal } from "@bpinternal/overwatch";

const myTodoSensor = async (repo: RepoHandle): Promise<Signal[]> => {
  const matches = await repo.grep("FIXME:", ["src/"]);
  return matches.map((match) => ({
    location: { file: match.file, line: match.line },
    message: `unresolved FIXME: ${match.content.trim()}`,
    priority: "low",
  }));
};

const loop = new ControlLoop({ /* ... */ sensor: myTodoSensor, /* ... */ });
```

Use this shape whenever the check is cheap and expressible with `exec`/`grep`/`glob` — closures
and host-side imports work normally, since it never leaves your process.

**Sandbox script** (`sensors.script(localPath)`) — for heavier scanners (custom static
analysis, project-specific tooling) that should run *inside* the sandbox with the repo root as
cwd, rather than round-tripping through the host:

```ts
// sensors/find-unhandled-promises.ts
export default async function (): Promise<import("@bpinternal/overwatch").Signal[]> {
  // this file is uploaded and run with `bun` inside the sandbox; cwd is the repo root
  // ... your scanning logic ...
  return [];
}
```

```ts
sensor: sensors.script("./sensors/find-unhandled-promises.ts"),
```

The default export must be `() => Promise<Signal[]>`. The loop wraps it in a small runner that
writes the result to a JSON file rather than stdout, so the script is free to `console.log` for
its own debugging.

**Built-in sensors** (`sensors.grep`, `sensors.astGrep`, `sensors.reactDoctor`) cover plain-text
search, structural AST search, and [react-doctor](https://react.doctor) diagnostics
respectively — check `src/sensors/` for their full option shapes before writing a custom one;
a `grep`/`astGrep` call with a custom `message` function often replaces what would otherwise be
a bespoke sensor.

Whatever shape you pick: keep `paths` (or the equivalent scope) intentional. An unscoped sensor
turns "fix this one thing" into "fix everything, everywhere, forever."

## Writing a custom picker

A picker narrows the sensed (and unclaimed) signals down to what one run should act on:

```ts
type Picker = (signals: Signal[]) => Promise<Signal[]> | Signal[];
```

```ts
import type { Signal } from "@bpinternal/overwatch";

const highPriorityFirst = (max: number) => (signals: Signal[]): Signal[] =>
  [...signals]
    .sort((a, b) => rank(b.priority) - rank(a.priority))
    .slice(0, max);

function rank(p: Signal["priority"]): number {
  return { high: 2, medium: 1, low: 0 }[p];
}
```

Built-ins: `pickers.count(n)` (first `n` in sensor order — the default) and
`pickers.busiestFile(maxCount?)` (every signal in whichever single file has the most, so a run's
fixes land together in one coherent PR). Sort inside your sensor, or write a picker like the one
above, to change what "first" means.

## Actuators

The **actuator** owns everything after picking — it decides what actually *happens* to the
signals a run selected, and reports the outcome. It's an abstract class with one method:

```ts
abstract class Actuator<TData = unknown> {
  abstract act(input: ActuatorInput<TData>): Promise<ControlLoopRunResult<TData>>;
}
```

`act` receives the picked `signals`, the provisioned `sandbox`, an `AgentContext` (`ctx`) for
running commands / writing files in it, a `sense()` callback to re-run the sensor, the loop's
`config`, its `label`/`displayLabel`, and the run `log` — everything needed to do the work and
return a `ControlLoopRunResult`.

### The default: `AgentPrActuator`

Most loops want the built-in behavior: run the agent on each signal, verify by re-sensing (with
retries), then commit and open one PR. That's `AgentPrActuator`, and it takes an
**instructions builder** — a function turning one signal into the agent's prompt:

```ts
type InstructionBuilder<TData = unknown> =
  (signal: Signal<TData>) => Promise<{ instructions: string }> | { instructions: string };
```

```ts
import { AgentPrActuator, actuators } from "@bpinternal/overwatch";

new AgentPrActuator({
  instructions: (signal) => ({
    instructions: [
      `Fix this in ${signal.location?.file ?? "the codebase"}.`,
      `Issue: ${signal.message}`,
      "Make the smallest change that resolves it — no unrelated refactors.",
    ].join("\n"),
  }),
});
```

Reach into `signal.data` for anything sensor-specific — e.g. `sensors.reactDoctor` attaches the
full diagnostic (including its `help` text) there, and `sensors.astGrep`/`sensors.grep` attach
the raw match.

Two builders ship under `actuators` (pass one as `instructions`, or omit it — the default is
`fromSignal()`):

- `actuators.fromSignal()` — minimal instructions built from the signal alone; a good default.
- `actuators.fromFile(localPath)` — reads a local markdown/text file once (cached) and uses it as
  the instructions, with the signal's details appended. Use this when the fix follows a
  house style that's easier to write as a doc than to reconstruct per-signal — see
  `examples/blank-errors-instructions.md` for a real one (a full migration guide with a mapping
  table and before/after snippets).

`AgentPrActuator` appends two things to every instruction automatically: a retry nudge on
repeated attempts, and this loop's accumulated `/feedback` memory (see **PR review comments**
above). Don't duplicate either concern in your instructions builder.

### Writing a custom actuator

Subclass `Actuator` when you want a run to do something *other than* open a PR — post a report to
Slack, write a summary file, call an API, open an issue instead of a PR. The actuator need not
touch a coding agent at all; it just has to return a `ControlLoopRunResult`:

```ts
import { Actuator, type ActuatorInput, type ControlLoopRunResult } from "@bpinternal/overwatch";

class ReportOnly extends Actuator {
  async act({ signals, log }: ActuatorInput): Promise<ControlLoopRunResult> {
    log.info(`found ${signals.length} signal(s) — reporting without touching the repo`);
    await postToSlack(signals.map((s) => `• ${s.location?.file ?? "repo"}: ${s.message}`).join("\n"));
    return { status: "clean" }; // nothing was changed or opened
  }
}
```

The loop still handles sensing, claim-filtering, picking, and the `maxOpenPrCount` gate around
your actuator — those key off PRs carrying the loop's label, so they simply no-op for an actuator
that never opens one.

## Config reference (`ControlLoopConfig`)

The static, per-loop settings passed as `config`:

- **`git`** (`GitSource`, required) — use `new Github({ repo, branch, key })`. `key` is
  optional for cloning/counting PRs on a public repo, required to push or open a PR.
- **`agent`** (`Agent`, required) — `new Claude({ apiKey, model?, timeoutSec? })` or
  `new Codex({ apiKey, model?, timeoutSec? })`. Extend the abstract `Agent` class
  (`prepare`, `executeAgent`) to plug in another CLI.
- **`maxOpenPrCount`** — skip the run outright if this many PRs with the loop's label are
  already open.
- **`branchPrefix`** — default `"control-loop"`; pushed branches look like
  `<prefix>/<label-slug>-<run-id>`.
- **`hooks.setup`** — shell command run right after cloning (e.g. `"bun install"`). Non-zero
  exit aborts the run.
- **`hooks.preCommit`** — shell command run after the agent, before committing (e.g. your
  repo's auto-formatter). Normalizes both agent edits and anything the loop wrote, so the PR
  passes formatting CI. Non-zero exit aborts the run.
- **`env`** — env vars set on the sandbox at creation (available to `hooks` and the agent).
- **`maxFixAttempts`** — default 3; see step 6 above.
- **`sandbox.snapshot`** — a Daytona snapshot to create the sandbox from instead of the default
  image. Pre-bake your toolchain and the agent CLI here to skip per-run installs. Note:
  resource sizing must be baked into the snapshot itself — it can't be requested at creation
  time when using one.

## Logging

Every run narrates its steps to stderr via `RunLog` (sandbox creation, cloning, sensing,
per-signal agent runs, commit/push, PR open) — nothing to configure, just watch stderr when
running a loop manually. Set `CONTROL_LOOP_SILENT=1` to mute it; colors otherwise follow
`NO_COLOR` and TTY detection.

## Extending

- **New sensor flavor**: add a file to `src/sensors/` returning `SensorFn` and re-export it from
  `src/sensors/index.ts` (or use `sensors.script`/a raw function inline — you don't need a
  built-in for one-off scans).
- **New picker**: any `(signals: Signal[]) => Signal[] | Promise<Signal[]>` works inline; add a
  file to `src/pickers/` (re-exported from its `index.ts`) only if it's broadly reusable.
- **New instructions style**: add an `InstructionBuilder` factory to `src/actuators/instructions.ts`
  (like `fromFile`/`fromSignal`), or pass one inline to `AgentPrActuator`.
- **New actuator kind** (doesn't open a PR / doesn't run an agent): add a file to `src/actuators/`
  with a class that subclasses the abstract `Actuator`, re-exported from `src/actuators/index.ts`.
- **New agent CLI**: extend the abstract `Agent` class in `src/agents.ts`.
- **New forge** (GitLab, etc.): implement the `GitSource` interface from `src/github.ts`.

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. Since the packages are catered to our own use-cases, they might have less stable APIs, receive breaking changes without much warning, have minimal documentation and lack community-focused support. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install or fork this package feel absolutly free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.

