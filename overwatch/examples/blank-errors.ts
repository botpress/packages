import { ControlLoop, pickers, sensors, actuators } from "../index";
import * as common from "./common";

export const nakedErrorLoop2 = new ControlLoop({
  // Label of the control loop. Its slug ("my-control-loop-label") is applied to
  // every PR this loop opens, and is what maxOpenPrCount counts against.
  label: "Naked Error Should be ServiceError",
  // Static settings live under `config`; the loop's behavior (sensor, picker,
  // actuator) sits alongside it.
  config: common.config,
  // The sensor detects anomalies (signals). This one runs ast-grep inside the sandbox:
  //   ast-grep run --pattern 'throw new Error($$$)' --lang ts packages/backend/src/trpc/routers/
  // `paths` is required — scope the scan to the folders the loop owns.
  //
  // Other flavors ship with the lib:
  // - `sensors.grep({ pattern: "TODO:", paths: ["src/"] })` for plain-text search
  // - a plain async callback `(repo) => Signal[]` — runs on the host, with `repo`
  //   proxying exec, readFile, glob, and grep into the sandbox
  // - `sensors.script("./sensors/my-sensor.ts")` for heavy scanners that run fully
  //   inside the sandbox — a file whose default export is `() => Promise<Signal[]>`,
  //   executed with the repo root as cwd
  sensor: sensors.astGrep({
    pattern: "throw new Error($$$)",
    language: "ts",
    paths: ["packages/backend/src/trpc/routers/"],
    message: (match) => `raw Error thrown in a tRPC router (should be a TRPCError): ${match.text}`,
    priority: "medium",
  }),
  // Choose which of the sensed signals to act on this run. `pick` is the default
  // (first N in sensor order); any (signals) => Signal[] works.
  picker: pickers.count(1),
  // The actuator decides what happens to the picked signals. The default
  // `AgentPrActuator` runs the coding agent once per signal, re-senses to verify each
  // fix (retried up to maxFixAttempts times), then commits every fix to one branch and
  // opens a single PR. Its `instructions` builder produces the prompt per signal:
  // `actuators.fromFile("./instructions.md")` uses a local file's contents (signal
  // details appended), and `actuators.fromSignal()` (the default) builds them from the
  // signal alone. Swap in your own `Actuator` subclass for behavior that doesn't open a
  // PR or run an agent.
  actuator: new actuators.AgentPrActuator({
    instructions: actuators.fromFile("../blank-errors-instructions.md"),
  }),
});

// This loop is driven through the shared `LoopOrchestrator` in `orchestrator.ts`, not its own
// CLI — the orchestrator is the single entry point CI wires the comment webhook to.
