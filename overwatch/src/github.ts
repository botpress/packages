import type { Sandbox } from "@daytona/sdk";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "octokit";

/** Committer identity used when the git source can't derive an account-backed one. */
const DEFAULT_BOT_NAME = "control-loop[bot]";
const DEFAULT_BOT_EMAIL = "control-loop@users.noreply.github.com";

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
 * Where the code comes from and where the PR goes. Implemented by {@link Github}
 * and {@link GithubApp} (both on the {@link GithubBase} that holds the shared logic);
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
  /**
   * Resolved `{ name, email }` to stamp on the loop's commits. The email must be one GitHub
   * can attribute to a real account, or downstream gates that verify commit authorship (e.g.
   * Vercel's Git author verification) reject the PR's deploys. {@link GithubApp} overrides
   * this with its App's own verified bot address; the base returns a plain no-reply default.
   */
  committer(): Promise<{ name: string; email: string }>;
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

/** Fields common to every {@link GithubBase} subclass, regardless of how it authenticates. */
export type GithubBaseProps = {
  /** e.g. "https://github.com/botpress/some-repo.git" */
  repo: string;
  branch: string;
  /**
   * Committer email stamped on the loop's commits. Optional; set it to attribute the
   * PR's commits to a specific bot/user account instead of the default no-reply address.
   */
  email?: string;
};

/**
 * Shared GitHub logic — everything that only depends on `owner`/`name` and an
 * {@link Octokit} instance, independent of *how* that Octokit is authenticated. The two
 * concrete subclasses ({@link Github}, {@link GithubApp}) differ only in how they build
 * the Octokit and hand out a git-over-HTTPS token; everything past that lives here.
 */
export abstract class GithubBase implements GitSource {
  readonly branch: string;
  readonly email?: string;
  protected readonly repoUrl: string;
  protected readonly owner: string;
  protected readonly name: string;
  /** Set by the subclass constructor with the auth strategy that subclass implements. */
  protected abstract readonly octokit: Octokit;

  constructor(props: GithubBaseProps) {
    this.repoUrl = props.repo;
    this.branch = props.branch;
    this.email = props.email || undefined;

    const match = props.repo.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) throw new Error(`could not parse owner/repo from "${props.repo}"`);
    this.owner = match[1]!;
    this.name = match[2]!;
  }

  /**
   * Token to embed as the `x-access-token` password for git over HTTPS (clone/push), or
   * `undefined` when unauthenticated (an anonymous public-repo clone). For a GitHub App
   * this mints a short-lived installation access token per call.
   */
  protected abstract gitToken(): Promise<string | undefined>;

  /**
   * Whether authenticated operations (push, open PR, resolved-thread lookup) are possible.
   * A PAT-less {@link Github} can still clone and count PRs on a public repo but not push.
   */
  protected abstract get authenticated(): boolean;

  async committer(): Promise<{ name: string; email: string }> {
    return { name: DEFAULT_BOT_NAME, email: this.email ?? DEFAULT_BOT_EMAIL };
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
    const token = await this.gitToken();
    await sandbox.git.clone(
      this.repoUrl,
      path,
      branch ?? this.branch,
      undefined,
      token ? "x-access-token" : undefined,
      token,
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
    this.requireAuth("push");
    const token = await this.gitToken();
    // Daytona's toolbox git is go-git, which rejects committed paths it deems invalid
    // (e.g. a file named `\` left behind by an agent) — pushing 500s with
    // `invalid path: "\\"`. The real git binary handles any filename, so push with it.
    // The token goes through git's credential store via an env var, keeping it off the
    // command line and out of error output.
    const setup = await sandbox.process.executeCommand(
      `printf 'https://x-access-token:%s@github.com\\n' "$GIT_TOKEN" > ~/.git-credentials && git config --global credential.helper store`,
      path,
      { GIT_TOKEN: token! },
      60,
    );
    if (setup.exitCode !== 0) {
      throw new Error(`configuring git credentials failed: ${setup.result}`);
    }
    // Push, rebasing onto the remote tip and retrying if the branch moved under us.
    // Two comment webhooks for the same PR clone the same head independently, so the
    // second push is rejected non-fast-forward; without this, that run's work would be
    // silently lost when its sandbox is torn down. Replaying our commits onto the new
    // tip preserves both updates. A bounded loop guards against a branch churning faster
    // than we can push.
    const quoted = branch.replace(/'/g, `'\\''`);
    const maxAttempts = 5;
    for (let attempt = 1; ; attempt++) {
      const push = await sandbox.process.executeCommand(
        `git push --set-upstream origin '${quoted}'`,
        path,
        undefined,
        300,
      );
      if (push.exitCode === 0) return;

      const rejected = /non-fast-forward|fetch first|\[rejected\]/i.test(push.result ?? "");
      if (!rejected || attempt >= maxAttempts) {
        throw new Error(`git push failed: ${push.result}`);
      }

      const rebase = await sandbox.process.executeCommand(
        `git fetch origin '${quoted}' && git rebase 'origin/${quoted}'`,
        path,
        undefined,
        300,
      );
      if (rebase.exitCode !== 0) {
        // A real content conflict can't be resolved unattended; abort to leave the tree
        // clean and surface it, rather than force-pushing over the other update.
        await sandbox.process.executeCommand("git rebase --abort", path, undefined, 60);
        throw new Error(
          `git push failed: branch '${branch}' diverged and auto-rebase hit a conflict: ${rebase.result}`,
        );
      }
    }
  }

  async openPr(params: {
    branch: string;
    title: string;
    body: string;
    label: string;
  }): Promise<string> {
    this.requireAuth("open a PR");
    await this.ensureLabel(params.label);
    const { data: pr } = await this.octokit.rest.pulls.create({
      owner: this.owner,
      repo: this.name,
      title: params.title,
      head: params.branch,
      base: this.branch,
      body: params.body,
    });

    // The loop counts and discovers its PRs purely by label (see `openPrIssues`), so a PR
    // that exists without the label is invisible: the next run would miss it, exceed
    // `maxOpenPrCount`, and reopen the same signals. Labeling can't be made atomic with
    // creation (the REST API has no combined call), so retry it to ride out a transient
    // blip without discarding the agent's work, and if it still fails, close the PR rather
    // than leave an unlabeled orphan — the signals stay unclaimed and a later run retries.
    try {
      await this.retry(() =>
        this.octokit.rest.issues.addLabels({
          owner: this.owner,
          repo: this.name,
          issue_number: pr.number,
          labels: [params.label],
        }),
      );
    } catch (error) {
      await this.closePrQuietly(pr.number);
      throw new Error(
        `opened PR #${pr.number} but could not label it "${params.label}"; closed it to avoid an ` +
          `unlabeled orphan the loop can't count or claim. Cause: ${(error as Error).message ?? String(error)}`,
      );
    }
    return pr.html_url;
  }

  /** Retries a request a few times; the label call must not be abandoned over a transient error. */
  private async retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError;
  }

  /** Best-effort PR close used to roll back a partially-created PR; a failure here is swallowed. */
  private async closePrQuietly(prNumber: number): Promise<void> {
    try {
      await this.octokit.rest.pulls.update({
        owner: this.owner,
        repo: this.name,
        pull_number: prNumber,
        state: "closed",
      });
    } catch {
      // Nothing we can do — the caller is already throwing the underlying labeling error.
    }
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
   * is only exposed by GitHub's GraphQL API, which always requires auth — when
   * unauthenticated, nothing is filtered.
   */
  private async resolvedReviewCommentIds(prNumber: number): Promise<Set<number>> {
    const ids = new Set<number>();
    if (!this.authenticated) return ids;

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

  protected requireAuth(action: string): void {
    if (!this.authenticated)
      throw new Error(`Github authentication is required to ${action} on ${this.owner}/${this.name}`);
  }
}

/**
 * GitHub token. Optional for cloning/counting PRs on public repos, but required to
 * push and open PRs — a run that reaches the PR stage without one fails there.
 */
export type GithubProps = GithubBaseProps & { key?: string };

/** Authenticates as a user/bot via a personal access token (or installation token string). */
export class Github extends GithubBase {
  protected readonly octokit: Octokit;
  private readonly key?: string;

  constructor(props: GithubProps) {
    super(props);
    this.key = props.key || undefined;
    this.octokit = new Octokit({ auth: this.key });
  }

  protected async gitToken(): Promise<string | undefined> {
    return this.key;
  }

  protected get authenticated(): boolean {
    return Boolean(this.key);
  }
}

/**
 * Credentials for a GitHub App installation. Unlike a PAT these are never optional —
 * an App only ever acts through an installation, so it is always authenticated.
 */
export type GithubAppProps = GithubBaseProps & {
  /** The App's numeric ID (Settings → Developer settings → GitHub Apps). */
  appId: string | number;
  /** The App's PEM private key, contents inline (not a file path). */
  privateKey: string;
  /** ID of the installation on the target account whose token the App should mint. */
  installationId: string | number;
};

/**
 * Authenticates as a GitHub App installation. Octokit's app auth strategy mints and
 * refreshes short-lived installation access tokens on demand, so REST/GraphQL calls just
 * work; {@link gitToken} pulls the current installation token out for git over HTTPS.
 */
export class GithubApp extends GithubBase {
  protected readonly octokit: Octokit;
  private botIdentity?: { name: string; email: string };

  constructor(props: GithubAppProps) {
    super(props);
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: props.appId,
        privateKey: props.privateKey,
        installationId: props.installationId,
      },
    });
  }

  /**
   * The App's own bot identity: `<slug>[bot]` with the canonical
   * `<user-id>+<slug>[bot]@users.noreply.github.com` no-reply email GitHub recognises.
   * Committing under this makes GitHub attribute the commit to the App's bot account, which
   * author-verification gates (e.g. Vercel) require — the base default's made-up address
   * belongs to no account, so those gates block the resulting deploys. An explicit `email`
   * prop still wins. Cached: the app/user lookups don't change within a run.
   */
  override async committer(): Promise<{ name: string; email: string }> {
    if (this.email) return { name: DEFAULT_BOT_NAME, email: this.email };
    if (!this.botIdentity) {
      const { data: app } = await this.octokit.rest.apps.getAuthenticated();
      const login = `${app!.slug}[bot]`;
      const { data: user } = await this.octokit.rest.users.getByUsername({ username: login });
      this.botIdentity = {
        name: login,
        email: `${user.id}+${login}@users.noreply.github.com`,
      };
    }
    return this.botIdentity;
  }

  protected async gitToken(): Promise<string> {
    const auth = (await this.octokit.auth({ type: "installation" })) as { token: string };
    return auth.token;
  }

  protected get authenticated(): boolean {
    return true;
  }
}
