import { ControlLoop, pickers, sensors, actuators } from "../index";
import * as common from "./common";

const loop = new ControlLoop({
  label: "Naked Error Should be ServiceError",
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

loop.cli();
