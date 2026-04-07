import * as types from '../types'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as errors from '../errors'
import * as utils from '../utils'

export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml'
export const LOCAL_VERSION_PREFIX = 'workspace:'

export class PnpmWorkspaceService implements types.PnpmService {
  public constructor(
    private _pkgJsonService: types.PackageJsonService,
    private _fs: types.FsRepository,
    private _rootDir: string
  ) {}
  public searchWorkspaces = async () => {
    const pnpmWorkspacesFile = pathlib.join(this._rootDir, PNPM_WORKSPACE_FILE)
    if (!this._fs.existsSync(pnpmWorkspacesFile)) {
      throw new errors.DepSynkyError(`Could not find ${PNPM_WORKSPACE_FILE} at "${this._rootDir}"`)
    }
    const pnpmWorkspacesContent = await this._fs.readFile(pnpmWorkspacesFile)
    const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
    const globMatches = pnpmWorkspaces.flatMap((ws) => this._fs.globSync(ws, { absolute: false, cwd: this._rootDir }))
    const absGlobMatches = globMatches.map(this._abs)
    const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
    const actualPackages = packageJsonPaths.filter((f) => this._fs.existsSync(f))
    const absolutePaths = actualPackages.map(this._abs)
    const workspaces = await Promise.all(
      absolutePaths.map(async (p) => ({ path: p, content: await this._pkgJsonService.read(p) }))
    )
    return workspaces
  }

  public findDirectReferences = async (
    pkgName: string
  ): Promise<{ dependency: types.PnpmWorkspace; dependents: types.PnpmWorkspace[] }> => {
    const workspaces = await this.searchWorkspaces()
    const dependency = workspaces.find((w) => w.content.name === pkgName)
    if (!dependency) {
      throw new errors.DepSynkyError(`Could not find package "${pkgName}"`)
    }
    const dependents = this._findDirectDependents(workspaces, pkgName)
    return { dependency, dependents }
  }

  public findRecursiveReferences = async (pkgName: string) => {
    const workspaces = await this.searchWorkspaces()
    const dependency = workspaces.find((w) => w.content.name === pkgName)
    if (!dependency) {
      throw new errors.DepSynkyError(`Could not find package "${pkgName}"`)
    }

    const visited = new utils.sets.SetBy<types.PnpmWorkspace>([], (s) => s.content.name)
    const queued = new utils.sets.SetBy<types.PnpmWorkspace>([dependency], (s) => s.content.name)

    while (queued.length > 0) {
      const currentPkg = queued.shift()!
      if (visited.hasKey(currentPkg.content.name)) {
        continue
      }

      visited.add(currentPkg)

      const dependents = this._findDirectDependents(workspaces, currentPkg.content.name)
      for (const dependent of dependents) {
        if (!visited.hasKey(dependent.content.name) && !queued.hasKey(dependent.content.name)) {
          queued.add(dependent)
        }
      }
    }

    const dependents = visited.values.filter((w) => w.content.name !== pkgName)
    return { dependency, dependents }
  }

  public isLocalVersion = (version: string) => version.startsWith(LOCAL_VERSION_PREFIX)

  private _findDirectDependents = (workspaces: types.PnpmWorkspace[], pkgName: string): types.PnpmWorkspace[] => {
    // devDependencies are'nt considered as real dependencies for the purpose of bumping versions, so we ignore them here
    return workspaces.filter((w) => w.content.dependencies?.[pkgName] || w.content.peerDependencies?.[pkgName])
  }

  public listPublicPackages = async (): Promise<string[]> => {
    const workspaces = await this.searchWorkspaces()
    return workspaces.filter((w) => !w.content.private).map((w) => w.content.name)
  }

  private _abs = (p: string) => pathlib.resolve(this._rootDir, p)
}
