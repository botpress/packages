export type PackageJson = {
  name: string
  version: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export type PackageJsonService = {
  read: (filePath: string) => Promise<PackageJson>
  write: (filePath: string, content: PackageJson) => Promise<void>
  update: (filePath: string, content: Partial<PackageJson>) => Promise<void>
}

export type PnpmWorkspace = {
  path: string
  content: PackageJson
}

export type PnpmService = {
  searchWorkspaces: () => Promise<PnpmWorkspace[]>
  findDirectReferences: (pkgName: string) => Promise<{ dependency: PnpmWorkspace; dependents: PnpmWorkspace[] }>
  findRecursiveReferences: (pkgName: string) => Promise<{ dependency: PnpmWorkspace; dependents: PnpmWorkspace[] }>
  listPublicPackages: () => Promise<string[]>
  isLocalVersion: (version: string) => boolean
}

export type GlobOptions = {
  absolute?: boolean
  cwd?: string
}
export type FsRepository = {
  existsSync: (path: string) => boolean
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  globSync: (pattern: string, opts?: Partial<GlobOptions>) => string[]
}

export type PromptRepository = {
  promptChoices: <T extends string>(args: { message: string; choices: { name: string; value: T }[] }) => Promise<T>
}
