import * as types from '../types'
import * as semver from 'semver'
import * as errors from '../errors'
import * as utils from '../utils'

const { logger } = utils.logging

export type BumpVersionArgs = {
  pkgName: string
  sync: boolean
}

export type CheckVersionsArgs = {
  ignorePeers?: boolean
  ignoreDev?: boolean
  targetVersions?: Record<string, string>
}

export type ListVersionsResult = Record<string, string>

export type SyncVersionsArgs = {
  ignorePeers?: boolean
  ignoreDev?: boolean
  targetVersions?: Record<string, string>
}

export class DepSynkyApplication {
  public constructor(
    private readonly _pnpmRepo: types.PnpmRepository,
    private readonly _pkgJsonRepo: types.PackageJsonRepository,
    private readonly _promptRepo: types.PomptRepository
  ) {}

  public async bumpVersion(args: BumpVersionArgs) {
    let pkgName = args.pkgName

    const { dependency, dependents } = await this._findRecursiveReferences(pkgName)
    const targetPackages = [dependency, ...dependents]

    const currentVersions = this._pnpmVersions(targetPackages)
    const targetVersions = { ...currentVersions }

    for (const { path: pkgPath, content } of targetPackages) {
      if (content.private) {
        continue // no need to bump the version of private packages
      }

      const jump = await this._promptRepo.promptJump(content.name, content.version)
      if (jump === 'none') {
        continue
      }

      const next = semver.inc(content.version, jump)
      if (!next) {
        throw new errors.DepSynkyError(`Invalid version jump: ${jump}`)
      }

      targetVersions[content.name] = next
      await this._pkgJsonRepo.update(pkgPath, { version: next })
    }

    await this.listVersions()
    if (args.sync) {
      logger.info('Syncing versions...')
      this.syncVersions({ ...args, targetVersions })
    }
  }

  public async checkVersions(args: CheckVersionsArgs) {
    const allPackages = await this._pnpmRepo.searchWorkspaces()
    const targetVersions = args.targetVersions ?? this._pnpmVersions(allPackages)

    for (const { content } of allPackages) {
      const { dependencies, devDependencies, peerDependencies } = content

      const check = this._makePackageChecker(content)
      check(dependencies, targetVersions)
      if (!args.ignorePeers) check(peerDependencies, targetVersions)
      if (!args.ignoreDev) check(devDependencies, targetVersions)
    }

    logger.info('All versions are in sync')
  }

  public async listVersions(): Promise<ListVersionsResult> {
    const allPackages = await this._pnpmRepo.searchWorkspaces()

    const versions: Record<string, string> = {}

    for (const { content } of allPackages) {
      if (content.private) {
        continue
      }
      versions[content.name] = content.version
    }

    return versions
  }

  public async syncVersions(args: SyncVersionsArgs) {
    const allPackages = await this._pnpmRepo.searchWorkspaces()
    const targetVersions = args.targetVersions ?? this._pnpmVersions(allPackages)

    for (const { path: pkgPath, content } of allPackages) {
      const { dependencies, devDependencies, peerDependencies } = content

      const update = this._makeUpdater(content)

      const updatedDeps = update(dependencies, targetVersions)
      const updatedPeerDeps = args.ignorePeers ? peerDependencies : update(peerDependencies, targetVersions)
      const updatedDevDeps = args.ignoreDev ? devDependencies : update(devDependencies, targetVersions)

      await this._pkgJsonRepo.update(pkgPath, {
        dependencies: updatedDeps,
        devDependencies: updatedDevDeps,
        peerDependencies: updatedPeerDeps
      })
    }
  }

  private _makeUpdater =
    (pkg: types.PackageJson) => (current: Record<string, string> | undefined, target: Record<string, string>) => {
      if (!current) {
        return current
      }

      for (const [name, version] of utils.objects.entries(target)) {
        const currentVersion = current[name]
        if (!currentVersion) {
          continue
        }
        const isLocal = utils.pnpm.isLocalVersion(currentVersion)
        const isPublic = !pkg.private
        if (isLocal) {
          if (isPublic) {
            utils.logging.logger.warn(
              `Package ${pkg.name} is public and cannot depend on local package ${name}. To keep reference on local package, make ${pkg.name} private.`
            )
          }
          current[name] = currentVersion
          continue
        }
        current[name] = utils.semver.attemptBumpLowerbound(currentVersion, version)
      }
      return current
    }

  private _makePackageChecker =
    (pkg: types.PackageJson) => (current: Record<string, string> | undefined, target: Record<string, string>) => {
      if (!current) {
        return
      }

      for (const [name, targetVersion] of utils.objects.entries(target)) {
        const currentVersion = current[name]
        if (!currentVersion) {
          continue
        }
        const isLocal = utils.pnpm.isLocalVersion(currentVersion)
        const isPublic = !pkg.private
        if (isLocal) {
          if (isPublic) {
            throw new errors.DepSynkyError(
              `Package ${pkg.name} is public and cannot depend on local package ${name}. To keep reference on local package, make ${pkg.name} private.`
            )
          }
          continue
        }

        if (!semver.satisfies(targetVersion, currentVersion)) {
          throw new errors.DepSynkyError(
            `Dependency ${name} is out of sync in ${pkg.name}: ${currentVersion} < ${targetVersion}`
          )
        }
      }
    }

  private _findRecursiveReferences = async (pkgName: string) => {
    const workspaces = await this._pnpmRepo.searchWorkspaces()
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

      const dependents = utils.pnpm.findDirectDependents(workspaces, currentPkg.content.name)
      for (const dependent of dependents) {
        if (!visited.hasKey(dependent.content.name) && !queued.hasKey(dependent.content.name)) {
          queued.add(dependent)
        }
      }
    }

    const dependents = visited.values.filter((w) => w.content.name !== pkgName)
    return { dependency, dependents }
  }

  private _pnpmVersions = (workspaces: types.PnpmWorkspace[]): Record<string, string> => {
    return utils.objects.fromEntries(workspaces.map(({ content: { name, version } }) => [name, version]))
  }
}
