import { ControlLoop, pickers, sensors, actuators } from "../index";
import * as common from "./common";

const loop = new ControlLoop({
  label: "React Doctor Issues",
  config: common.config,
  sensor: sensors.reactDoctor({
    path: "packages/frontend",
    categories: ["Performance"],
  }),
  // Focus on the file with the most findings, capped at 5.
  picker: pickers.chain(pickers.busiestFile(), pickers.count(5)),
  // Default actuator: runs the agent per signal and opens a PR. Instructions default to
  // `actuators.fromSignal()`, so no `instructions` needed here.
  actuator: new actuators.AgentPrActuator(),
});

loop.cli();
