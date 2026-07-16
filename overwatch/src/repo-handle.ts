import type { Sandbox } from "@daytona/sdk";

export interface ExecResult {
  exitCode: number;
  output: string;
}

export interface ExecOptions {
  env?: Record<string, string>;
  timeoutSec?: number;
}

export interface GrepMatch {
  file: string;
  line: number;
  content: string;
}

/**
 * Read-oriented view of the cloned repo inside the sandbox, handed to host-side sensors.
 * Every method proxies to the sandbox; paths are relative to the repo root.
 */
export class RepoHandle {
  constructor(
    private readonly sandbox: Sandbox,
    private readonly repoPath: string,
  ) {}

  /** Runs a shell command with the repo root as cwd. */
  async exec(command: string, options?: ExecOptions): Promise<ExecResult> {
    const response = await this.sandbox.process.executeCommand(
      command,
      this.repoPath,
      options?.env,
      options?.timeoutSec ?? 300,
    );
    return { exitCode: response.exitCode, output: response.result };
  }

  async readFile(path: string): Promise<string> {
    const buffer = await this.sandbox.fs.downloadFile(`${this.repoPath}/${path}`);
    return buffer.toString("utf-8");
  }

  /** Glob for files, e.g. `glob("*.ts")`. Returned paths are relative to the repo root. */
  async glob(pattern: string): Promise<string[]> {
    const response = await this.sandbox.fs.searchFiles(this.repoPath, pattern);
    return response.files.map((file) => this.relative(file));
  }

  /**
   * Search file contents, e.g. `grep("TODO:")`. File paths are relative to the repo
   * root. Pass `paths` to restrict the search to those folders (also repo-relative).
   */
  async grep(pattern: string, paths?: string[]): Promise<GrepMatch[]> {
    const roots = paths?.length ? paths : ["."];
    const results = await Promise.all(roots.map((root) => this.sandbox.fs.findFiles(this.resolve(root), pattern)));
    return results.flat().map((match) => ({
      file: this.relative(match.file),
      line: match.line,
      content: match.content,
    }));
  }

  private resolve(path: string): string {
    const trimmed = path.replace(/^\.\/?/, "").replace(/\/+$/, "");
    return trimmed === "" ? this.repoPath : `${this.repoPath}/${trimmed}`;
  }

  private relative(file: string): string {
    const marker = `${this.repoPath}/`;
    const index = file.indexOf(marker);
    return index === -1 ? file : file.slice(index + marker.length);
  }
}
