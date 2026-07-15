Default to **pnpm** as the package manager and **Node.js** as the runtime for any install,
script, or test command. (`packageManager` is pinned in `package.json`.)

- Use `pnpm install` instead of `npm install` / `yarn install` / `bun install`.
- Use `pnpm run <script>` (or `pnpm <script>`) instead of the npm/yarn/bun equivalents.
- Use `pnpm test` — the runner is `vitest` (import test helpers from `"vitest"`; put a
  `*.test.ts` beside the code under test).
- Run one-off TypeScript scripts with `ts-node` (e.g. the esbuild `build.ts`). The shipped
  build is CommonJS, compiled per-file by esbuild plus `tsc` declarations — see the `build`,
  `bundle`, and `build:types` scripts in `package.json`.
- The runtime targets Node 18+: use `node:` built-ins (`node:fs/promises`,
  `node:child_process`) in host-side code, not Bun-specific APIs (`Bun.file`, `Bun.$`).
- Don't add `dotenv` to the library. Env vars (`DAYTONA_API_KEY`, etc.) are the caller's
  responsibility — a loop run under Node can load them with `node --env-file=.env`.

## What this is

**overwatch** (package name; repo dir is `headless`) is a headless library for building
*control loops*: scheduled bots that scan a repo for a specific class of anomaly, fix a few
instances with a coding agent, and open a PR — with no server, UI, or persistent process. You
invoke `loop.run()` from whatever scheduler you already have (cron, CI, a serverless handler)
and it does one cycle: **sense → pick → run actuator → verify → PR**.

There is no product surface beyond the library itself — `index.ts` is the sole public entry
point (re-exports everything under `./src`). `examples/` shows real usage; it is not shipped,
just reference material for authoring new loops.

## Architecture

- **`src/control-loop.ts`** — `ControlLoop`, the orchestrator. `run()` spins up a Daytona
  sandbox, clones the repo into it, runs the sensor, filters out signals already claimed by
  open PRs (see `src/claims.ts`), picks a subset, and hands the picked signals to the
  configured `actuator.act(...)`, which owns everything past picking and returns the run
  result. `applyPrComments(prNumber)` is the separate entry point wired to PR-comment webhooks:
  it clones the PR's branch, hands new comments to the agent, and pushes to the same branch.
  `cli()` is the third entry point — a thin wrapper (see `src/cli.ts`) exposing `run` and
  `apply-comments` as subcommands so a loop file can be driven from CI with `loop.cli()`.
  Everything the loop/actuator hands an agent is behind the small `AgentContext` (`exec`,
  `writeFile`) — this is intentionally the only surface agents get (an actuator itself also
  receives the raw `Sandbox`, since it's the layer allowed to drive git and open PRs).
- **`src/cli.ts`** — `runCli`, backing `ControlLoop.cli()`: a [commander](https://github.com/tj/commander.js)
  program with `run` and `apply-comments <pr>` subcommands, result-summary printing, and CI-friendly
  exit codes (non-zero on error or an unresolved `fix-failed`). Keep command wiring here, not in
  `control-loop.ts`.
- **`src/types.ts`** — the core vocabulary: `Signal` (an anomaly), `Sensor`/`SensorFn`/
  `SensorScript`, `Picker`, `InstructionBuilder` (builds an agent prompt per signal),
  `CommentActuator`, and the `ControlLoopOptions`/`ControlLoopConfig` shapes. Read this file
  first when extending the lib — it's the contract everything else implements against.
- **`src/actuators/`**, **`src/sensors/`**, **`src/pickers/`** — each is a folder whose
  `index.ts` holds that part's *types* (and its shared/common logic) and re-exports the default
  implementations that live in sibling files; the whole folder is namespace-exported
  (`import { sensors, pickers, actuators } from "./index"`). So the part's vocabulary lives with
  the part, not in `types.ts`:
  - `actuators/`: `index.ts` = the `InstructionBuilder`/`CommentActuator`/`ActuatorInput` types
    (and re-exports the `Actuator` base). The abstract `Actuator` class is in `actuator.ts` — kept
    out of `index.ts` on purpose so `agent-pr.ts` can `extends` it without a barrel↔subclass
    require-cycle under the CommonJS build. Defaults: `agent-pr.ts` (`AgentPrActuator`, the
    agent-per-signal + verify + commit + PR flow), `instructions.ts` (`fromFile`/`fromSignal`),
    `comments.ts` (`prComments`).
  - `sensors/`: `index.ts` = the `Sensor`/`SensorFn`/`SensorScript` types. Defaults: `grep.ts`,
    `ast-grep.ts`, `react-doctor.ts`, `script.ts` (each also owns its own option/result types).
  - `pickers/`: `index.ts` = the `Picker` type plus `chain` (the combinator). Defaults:
    `count.ts`, `busiest-file.ts`.
  - Adding a new built-in = a new sibling file re-exported from that folder's `index.ts`, not a
    new abstraction. Implementations import the part's types from their `index.ts` and `Signal`
    et al. from `../types`.
- **`src/sandbox.ts`**, **`src/claims.ts`** — internal (not re-exported) shared helpers.
  `sandbox.ts` holds the sandbox-execution helpers used by both `control-loop.ts` and the
  actuator (`REPO_PATH`/`SCRATCH_DIR`, `commitAll`, `runConfiguredCommand`, the memory helpers);
  `claims.ts` holds the claim-marker mechanism (`signalKey`, `claimMarker`, `parseClaimedKeys`) —
  the actuator writes the marker into a PR body, the loop reads it to skip already-claimed signals.
- **`src/agents.ts`** — `Agent` abstract class (`prepare`, `executeAgent`) plus the `Claude` and
  `Codex` implementations, each responsible for installing/authenticating its own CLI inside
  the sandbox and invoking it non-interactively.
- **`src/github.ts`** — `GitSource` interface plus the `Github` implementation (Octokit-backed).
  The interface exists so another forge could slot in later; don't add GitHub-specific methods
  to `GitSource` itself.
- **`src/repo-handle.ts`** — `RepoHandle`, the read-oriented proxy into the sandbox handed to
  host-side (`SensorFn`) sensors: `exec`, `readFile`, `glob`, `grep`.
- **`src/log.ts`** — `RunLog`, a dependency-free stderr narrator for one run. Muted via
  `CONTROL_LOOP_SILENT=1`.

## Conventions to follow when editing this codebase

- **Signal identity is `file + message`, never `line`.** Line numbers shift after an edit, so
  don't fold `line` into any dedup/matching key (see `signalKey` in `src/claims.ts`). When
  writing a new sensor's default `message`, keep it stable for a given anomaly — don't embed
  line numbers or timestamps in it.
- **Shell interpolation goes through `shellQuote`** (single-quote + escape), never raw string
  interpolation into a command — patterns from sensors/actuators carry arbitrary user text
  (`$VAR`s, quotes, etc.). Each file that shells out defines its own local `shellQuote`; don't
  extract a shared one unless you're already touching all call sites.
- **Prompts to agents go through a staged file (`stagePrompt` in `agents.ts`), not inline
  shell args** — instructions contain arbitrary sensor/user text that would otherwise need
  re-escaping for the shell.
- **Commits use the real `git` binary with `--no-verify`**, not Daytona's toolbox git — see the
  comments on `commitAll` in `src/sandbox.ts` for why (go-git chokes on pathological
  filenames; repo git hooks target interactive developers, not a bot). Repo formatting
  conventions are applied via `config.hooks.preCommit` instead of relying on hooks.
- **Every sandbox is created at `HIGH_RESOURCES`** (4 vCPU / 8 GiB / 10 GiB disk) unless a
  snapshot is configured — the default tier OOM-kills dependency installs on real repos. Don't
  drop this default without a reason.
- Doc comments (`/** ... */`) on exported symbols explain *why*, not *what* — match that style
  rather than restating the type signature in prose.
- Tests run under `vitest` (`pnpm test`); `src/pickers.test.ts` is the current suite. If you
  add meaningful logic (parsing, key-matching, retry logic), add a `*.test.ts` beside it
  (importing helpers from `"vitest"`) rather than leaving it untested.
