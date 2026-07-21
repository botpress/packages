import { LoopOrchestrator } from "../index";
import { nakedErrorLoop1 } from "./blank-errors-no-comments";
import { nakedErrorLoop2 } from "./blank-errors";
import { reactDoctorLoop } from "./react-doctor";

// One entry point for every loop, so a single CI workflow can drive them all. In particular a
// lone `pull_request_review_comment` job runs `orchestrator.ts apply-comments <pr>`, and the
// orchestrator dispatches it to whichever loop opened that PR (matched by label).
//   bun examples/orchestrator.ts list
//   bun examples/orchestrator.ts run react-doctor-issues
//   bun examples/orchestrator.ts apply-comments 1234
new LoopOrchestrator()
  .register(nakedErrorLoop1)
  .register(nakedErrorLoop2)
  .register(reactDoctorLoop)
  .run();
