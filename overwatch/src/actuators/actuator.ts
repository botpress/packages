import type { ControlLoopRunResult } from "../types";
import type { ActuatorInput } from "./index";

/**
 * Owns the "act on the picked signals" step of a run and reports the outcome. The loop
 * senses, filters, and picks; the actuator decides what actually happens next.
 *
 * The default {@link AgentPrActuator} runs a coding agent per signal, verifies via
 * re-sensing, and opens a PR — but an actuator is free to do anything (post a message,
 * write a report, call an API) and need not touch an agent or open a PR at all.
 */
export abstract class Actuator<TData = unknown> {
  abstract act(input: ActuatorInput<TData>): Promise<ControlLoopRunResult<TData>>;
}
