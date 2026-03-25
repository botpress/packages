export type PackageJson = {
  name: string
  version: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export type PackageJsonRepository = {
  read: (filePath: string) => Promise<PackageJson>
  write: (filePath: string, content: PackageJson) => Promise<void>
  update: (filePath: string, content: Partial<PackageJson>) => Promise<void>
}

export type PnpmWorkspace = {
  path: string
  content: PackageJson
}

export type PnpmRepository = {
  searchWorkspaces: () => Promise<PnpmWorkspace[]>
  findDirectReferences: (pkgName: string) => Promise<{ dependency: PnpmWorkspace; dependents: PnpmWorkspace[] }>
  listPublicPackages: () => Promise<string[]>
}

export type PomptRepository = {
  promptJump: (pkgName: string, currentVersion: string) => Promise<'patch' | 'minor' | 'major' | 'none'>
}
