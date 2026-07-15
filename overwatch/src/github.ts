import type { Sandbox } from "@daytona/sdk";
import { Octokit } from "octokit";

/** A human comment on a PR. `file`/`line` are present for inline review comments only. */
export interface PrComment {
  id: number;
  author: string;
  body: string;
  file?: string;
  line?: number;
  createdAt: string;
}

/**
 * Where the code comes from and where the PR goes. Implemented by {@link Github};
 * the interface exists so other forges (GitLab, ...) can slot in later.
 */
export interface GitSource {
  /** Base branch the loop clones from and targets with its PR. */
  readonly branch: string;
  /**
   * Committer email stamped on the loop's commits (the ones that make up the PR).
   * Optional — the loop falls back to a default no-reply address when unset.
   */
  readonly email?: string;
  countOpenPrs(label: string): Promise<number>;
  /** Bodies of the open PRs carrying the loop's label; used to skip already-claimed signals. */
  listOpenPrBodies(label: string): Promise<string[]>;
  /** Clones `branch` (defaults to the base branch) into the sandbox at `path`. */
  cloneInto(sandbox: Sandbox, path: string, branch?: string): Promise<void>;
  push(sandbox: Sandbox, path: string, branch: string): Promise<void>;
  openPr(params: { branch: string; title: string; body: string; label: string }): Promise<string>;
  /** Head branch of the PR and the commit date of its tip, used to skip already-addressed comments. */
  getPr(prNumber: number): Promise<{ branch: string; headCommittedAt: string }>;
  /**
   * Comments on the PR — inline review comments and PR-level comments — oldest first.
   * Inline comments whose review thread has been resolved are excluded.
   */
  listPrComments(prNumber: number): Promise<PrComment[]>;
}

export type GithubProps = {
  /** e.g. "https://github.com/botpress/some-repo.git" */
  repo: string;
  branch: string;
  /**
   * GitHub token. Optional for cloning/counting PRs on public repos, but required to
   * push and open PRs — a run that reaches the PR stage without one fails there.
   */
  key?: string;
  /**
   * Committer email stamped on the loop's commits. Optional; set it to attribute the
   * PR's commits to a specific bot/user account instead of the default no-reply address.
   */
  email?: string;
};

export class Github implements GitSource {
  readonly branch: string;
  readonly email?: string;
  private readonly repoUrl: string;
  private readonly owner: string;
  private readonly name: string;
  private readonly key?: string;
  private readonly octokit: Octokit;

  constructor(props: GithubProps) {
    this.repoUrl = props.repo;
    this.branch = props.branch;
    this.email = props.email || undefined;
    this.key = props.key || undefined;
    this.octokit = new Octokit({ auth: this.key });

    const match = props.repo.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) throw new Error(`could not parse owner/repo from "${props.repo}"`);
    this.owner = match[1]!;
    this.name = match[2]!;
  }

  async countOpenPrs(label: string): Promise<number> {
    return (await this.openPrIssues(label)).length;
  }

  async listOpenPrBodies(label: string): Promise<string[]> {
    return (await this.openPrIssues(label)).map((issue) => issue.body ?? "");
  }

  // The issues endpoint covers PRs too (a PR is an issue with a `pull_request` key)
  // and, unlike /pulls, supports filtering by label server-side.
  private async openPrIssues(label: string) {
    const issues = await this.octokit.paginate(this.octokit.rest.issues.listForRepo, {
      owner: this.owner,
      repo: this.name,
      labels: label,
      state: "open",
      per_page: 100,
    });
    return issues.filter((issue) => issue.pull_request);
  }

  async cloneInto(sandbox: Sandbox, path: string, branch?: string): Promise<void> {
    await sandbox.git.clone(
      this.repoUrl,
      path,
      branch ?? this.branch,
      undefined,
      this.key ? "x-access-token" : undefined,
      this.key,
    );
  }

  async getPr(prNumber: number): Promise<{ branch: string; headCommittedAt: string }> {
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.name,
      pull_number: prNumber,
    });
    const { data: commit } = await this.octokit.rest.repos.getCommit({
      owner: this.owner,
      repo: this.name,
      ref: pr.head.sha,
    });
    const headCommittedAt = commit.commit.committer?.date ?? pr.created_at;
    return { branch: pr.head.ref, headCommittedAt };
  }

  async listPrComments(prNumber: number): Promise<PrComment[]> {
    const base = { owner: this.owner, repo: this.name, per_page: 100 };
    // Inline code comments live on the pulls endpoint, PR-level discussion on the
    // issues endpoint; a complete picture needs both. Thread resolution only exists
    // in the GraphQL API, so it's fetched separately to drop resolved threads.
    const [review, issue, resolved] = await Promise.all([
      this.octokit.paginate(this.octokit.rest.pulls.listReviewComments, {
        ...base,
        pull_number: prNumber,
      }),
      this.octokit.paginate(this.octokit.rest.issues.listComments, {
        ...base,
        issue_number: prNumber,
      }),
      this.resolvedReviewCommentIds(prNumber),
    ]);

    const comments: PrComment[] = [
      ...review
        .filter((comment) => !resolved.has(comment.id))
        .map((comment) => ({
          id: comment.id,
          author: comment.user.login,
          body: comment.body,
          file: comment.path,
          line: comment.line ?? comment.original_line ?? undefined,
          createdAt: comment.created_at,
        })),
      ...issue.map((comment) => ({
        id: comment.id,
        author: comment.user?.login ?? "unknown",
        body: comment.body ?? "",
        createdAt: comment.created_at,
      })),
    ];
    return comments.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async push(sandbox: Sandbox, path: string, branch: string): Promise<void> {
    this.requireKey("push");
    // Daytona's toolbox git is go-git, which rejects committed paths it deems invalid
    // (e.g. a file named `\` left behind by an agent) — pushing 500s with
    // `invalid path: "\\"`. The real git binary handles any filename, so push with it.
    // The token goes through git's credential store via an env var, keeping it off the
    // command line and out of error output.
    const setup = await sandbox.process.executeCommand(
      `printf 'https://x-access-token:%s@github.com\\n' "$GIT_TOKEN" > ~/.git-credentials && git config --global credential.helper store`,
      path,
      { GIT_TOKEN: this.key! },
      60,
    );
    if (setup.exitCode !== 0) {
      throw new Error(`configuring git credentials failed: ${setup.result}`);
    }
    const push = await sandbox.process.executeCommand(
      `git push --set-upstream origin '${branch.replace(/'/g, `'\\''`)}'`,
      path,
      undefined,
      300,
    );
    if (push.exitCode !== 0) {
      throw new Error(`git push failed: ${push.result}`);
    }
  }

  async openPr(params: {
    branch: string;
    title: string;
    body: string;
    label: string;
  }): Promise<string> {
    this.requireKey("open a PR");
    await this.ensureLabel(params.label);
    const { data: pr } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.name,
      title: params.title,
      head: params.branch,
      base: this.branch,
      body: params.body,
    });
    await this.octokit.rest.issues.addLabels({
      owner: this.owner,
      repo: this.name,
      issue_number: pr.number,
      labels: [params.label],
    });
    return pr.html_url;
  }

  private async ensureLabel(label: string): Promise<void> {
    try {
      await this.octokit.rest.issues.createLabel({
        owner: this.owner,
        repo: this.name,
        name: label,
        color: "0e8a16",
        description: "Opened by a control loop",
      });
    } catch (error) {
      // 422 = label already exists; anything else is a real failure.
      if ((error as { status?: number }).status !== 422) throw error;
    }
  }

  /**
   * IDs of inline review comments whose thread has been resolved. Thread resolution
   * is only exposed by GitHub's GraphQL API, which always requires auth — without a
   * key, nothing is filtered.
   */
  private async resolvedReviewCommentIds(prNumber: number): Promise<Set<number>> {
    const ids = new Set<number>();
    if (!this.key) return ids;

    const result = await this.octokit.graphql<{
      repository: {
        pullRequest: {
          reviewThreads: {
            nodes: Array<{
              isResolved: boolean;
              comments: { nodes: Array<{ databaseId: number | null }> };
            }>;
          };
        };
      };
    }>(
      `query ($owner: String!, $name: String!, $number: Int!) {
        repository(owner: $owner, name: $name) {
          pullRequest(number: $number) {
            reviewThreads(first: 100) {
              nodes { isResolved comments(first: 100) { nodes { databaseId } } }
            }
          }
        }
      }`,
      { owner: this.owner, name: this.name, number: prNumber },
    );

    for (const thread of result.repository.pullRequest.reviewThreads.nodes) {
      if (!thread.isResolved) continue;
      for (const comment of thread.comments.nodes) {
        if (comment.databaseId !== null) ids.add(comment.databaseId);
      }
    }
    return ids;
  }

  private requireKey(action: string): void {
    if (!this.key)
      throw new Error(`a Github key is required to ${action} on ${this.owner}/${this.name}`);
  }
}
