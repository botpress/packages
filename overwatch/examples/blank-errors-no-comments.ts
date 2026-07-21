import { ControlLoop, pickers, sensors, actuators } from "../index";
import * as common from "./common";

export const nakedErrorLoop1 = new ControlLoop({
  // Distinct from `nakedErrorLoop2`'s label: the orchestrator keys loops by label slug, so two
  // registered loops must not slugify to the same value.
  label: "Naked Error Should be ServiceError (busiest file)",
  config: common.config,
  sensor: sensors.astGrep({
    pattern: "throw new Error($$$)",
    language: "ts",
    paths: ["packages/backend/src/trpc/routers/"],
    message: (match) => `raw Error thrown in a tRPC router (should be a TRPCError): ${match.text}`,
    priority: "medium",
  }),
  picker: pickers.chain(pickers.busiestFile(), pickers.count(1)),
  actuator: new actuators.AgentPrActuator({
    instructions: actuators.fromFile("./examples/blank-errors-instructions.md"),
  }),
});
