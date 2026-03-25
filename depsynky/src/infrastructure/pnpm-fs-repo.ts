import * as types from '../types'
import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as errors from '../errors'
import * as utils from '../utils'

export class PnpmFsRepo implements types.PnpmRepository {
  public constructor(private _pkgJsonRepo: types.PackageJsonRepository, private _rootDir: string) {}
  public searchWorkspaces = async () => {
    const pnpmWorkspacesFile = pathlib.join(this._rootDir, utils.pnpm.PNPM_WORKSPACE_FILE)
    if (!fs.existsSync(pnpmWorkspacesFile)) {
      throw new errors.DepSynkyError(`Could not find ${utils.pnpm.PNPM_WORKSPACE_FILE} at "${this._rootDir}"`)
    }
    const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
    const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
    const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: this._rootDir }))
    const absGlobMatches = globMatches.map(this._abs)
    const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
    const actualPackages = packageJsonPaths.filter(fs.existsSync)
    const absolutePaths = actualPackages.map(this._abs)
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

  private _abs = (p: string) => pathlib.resolve(this._rootDir, p)
}
