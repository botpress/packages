import * as types from '../../types'
import * as yaml from 'yaml'
import * as errors from '../../errors'
import * as utils from '../../utils'
import * as pathlib from 'path'
import { InMemoryFileSystem } from './mem-fs'

export class PnpmInMemoryRepo implements types.PnpmRepository {
  public constructor(private _pkgJsonRepo: types.PackageJsonRepository, private _fs: InMemoryFileSystem) {}
  public searchWorkspaces = async () => {
    const pnpmWorkspacesFile = utils.pnpm.PNPM_WORKSPACE_FILE
    if (!this._fs.existsSync(pnpmWorkspacesFile)) {
      throw new errors.DepSynkyError(`Could not find ${utils.pnpm.PNPM_WORKSPACE_FILE} at root directory`)
    }
    const pnpmWorkspacesContent = await this._fs.readFile(pnpmWorkspacesFile)
    const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
    const absGlobMatches = pnpmWorkspaces.flatMap((ws) => this._fs.globSync(ws))
    const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
    const absolutePaths = packageJsonPaths.filter((f) => this._fs.existsSync(f))
    const workspaces = await Promise.all(
      absolutePaths.map(async (p) => ({ path: p, content: await this._pkgJsonRepo.read(p) }))
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
    const dependents = utils.pnpm.findDirectDependents(workspaces, pkgName)
    return { dependency, dependents }
  }

  public listPublicPackages = async (): Promise<string[]> => {
    const workspaces = await this.searchWorkspaces()
    return workspaces.filter((w) => !w.content.private).map((w) => w.content.name)
  }
}
