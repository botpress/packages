import type { PrComment } from "../github";
import type { CommentActuator } from "./index";

/** Default comment actuator used by `applyPrComments` when none is configured. */
export const prComments: CommentActuator = (comments: PrComment[]) => {
  const lines = comments.map((comment) =>
    comment.file
      ? `- ${comment.author} on \`${comment.file}${comment.line ? `:${comment.line}` : ""}\`: ${comment.body}`
      : `- ${comment.author} (PR-level): ${comment.body}`,
  );
  return {
    instructions: [
      "You are addressing review comments left on a pull request. Apply each comment's feedback to the code.",
      "Keep changes minimal and scoped to what the comments ask — do not refactor or fix anything else.",
      "",
      "Comments to address:",
      ...lines,
    ].join("\n"),
  };
};
