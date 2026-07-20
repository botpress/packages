import { Codex, Github, GithubApp, type ControlLoopConfig } from "../index";

export const config: ControlLoopConfig = {
  // If this many PRs with the loop's label are already open, the run is skipped
  // before a sandbox is even created.
  maxOpenPrCount: 1,
  // The git source. Cloned into the sandbox's filesystem; the PR targets `branch`.
  git: new GithubApp({
    repo: "https://github.com/botpress/desk.git",
    branch: "master",
    appId: process.env.GITHUB_OVERWATCH_APP_ID!,
    installationId: process.env.GITHUB_OVERWATCH_INSTALLATION_ID!,
    privateKey: process.env.GITHUB_OVERWATCH_PRIVATE_KEY!,
  }),
  // The agent that fixes anomalies inside the sandbox. Claude and Codex ship with
  // the lib; extend Agent to add others.
  agent: new Codex({ apiKey: process.env.CODEX_KEY!, model: "gpt-5.5" }),
  // Shell commands the loop runs inside the sandbox, from the repo root.
  hooks: {
    // Runs after cloning, before the sensor and agent — use it to set up the
    // environment they'll work in (install deps, generate code, etc.).
    //
    // desk keeps no .npmrc in the repo (developers rely on ~/.npmrc), so the sandbox
    // needs one written before installing, or fetching @botpress-private packages
    // from npm.pkg.github.com fails with a 401.
    setup: [
      `printf '//npm.pkg.github.com/:_authToken=%s\\n@botpress-private:registry=https://npm.pkg.github.com/\\n' "$NPM_TOKEN" > ~/.npmrc`,
      "bun install",
    ].join(" && "),
    // Repo auto-fix formatter, run after the agent finishes and before committing.
    // Commits skip local git hooks (--no-verify) — this is how the loop's changes
    // meet repo formatting so the PR's CI passes.
    preCommit: "bun run fix:format",
  },
  // Environment variables set on the sandbox at creation.
  env: { NPM_TOKEN: process.env.NPM_TOKEN! },
};
