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
    private readonly _pnpm: types.PnpmService,
    private readonly _pkgJson: types.PackageJsonService,
    private readonly _bump: types.BumpService
  ) {}

  public async bumpVersion(args: BumpVersionArgs) {
    const { dependency } = await this._pnpm.findDirectReferences(args.pkgName)

    const allPackages = await this._pnpm.searchWorkspaces()
    const targetVersions = this._pnpmVersions(allPackages)

    const visited = new Set<string>()
    const queue: types.PnpmWorkspace[] = [dependency]

    while (queue.length > 0) {
      const { path: pkgPath, content } = queue.shift()!
      if (visited.has(content.name)) {
        continue
      }
      visited.add(content.name)

      if (content.private) {
        continue // no need to bump the version of private packages
      }

      const jump = await this._bump.promptJump({
        pkgName: content.name,
        currentVersion: content.version
      })

      if (jump === 'none') {
        continue
      }

      const next = semver.inc(content.version, jump)
      if (!next) {
        throw new errors.DepSynkyError(`Invalid version jump: ${jump}`)
      }

      targetVersions[content.name] = next
      await this._pkgJson.update(pkgPath, { version: next })

      // only follow dependents of packages that were actually bumped
      const { dependents } = await this._pnpm.findDirectReferences(content.name)
      for (const dep of dependents) {
        if (!visited.has(dep.content.name)) {
          queue.push(dep)
        }
      }
    }

    await this.listVersions()
    if (args.sync) {
      logger.info('Syncing versions...')
      await this.syncVersions({ ...args, targetVersions })
    }
  }

  public async checkVersions(args: CheckVersionsArgs) {
    const allPackages = await this._pnpm.searchWorkspaces()
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
    const allPackages = await this._pnpm.searchWorkspaces()

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
    const allPackages = await this._pnpm.searchWorkspaces()
    const targetVersions = args.targetVersions ?? this._pnpmVersions(allPackages)

    for (const { path: pkgPath, content } of allPackages) {
      const { dependencies, devDependencies, peerDependencies } = content

      const update = this._makeUpdater(content)

      const updatedDeps = update(dependencies, targetVersions)
      const updatedPeerDeps = args.ignorePeers ? peerDependencies : update(peerDependencies, targetVersions)
      const updatedDevDeps = args.ignoreDev ? devDependencies : update(devDependencies, targetVersions)

      await this._pkgJson.update(pkgPath, {
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
        const isLocal = this._pnpm.isLocalVersion(currentVersion)
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
        const isLocal = this._pnpm.isLocalVersion(currentVersion)
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

  private _pnpmVersions = (workspaces: types.PnpmWorkspace[]): Record<string, string> => {
    return utils.objects.fromEntries(workspaces.map(({ content: { name, version } }) => [name, version]))
  }
}
