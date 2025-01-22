import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import * as errors from '../errors'
import * as utils from '../utils'

const { logger } = utils.logging

export type CheckVersionsOpts = {
  targetVersions: Record<string, string>
}

const checker =
  (pkg: utils.pkgjson.PackageJson) => (current: Record<string, string> | undefined, target: Record<string, string>) => {
    if (!current) {
      return
    }

    for (const [name, version] of utils.objects.entries(target)) {
      const currentVersion = current[name]
      if (!currentVersion) {
        continue
      }
      const isLocal = utils.pnpm.isLocalVersion(currentVersion)
      const isPublic = !pkg.private
      if (isPublic && isLocal) {
        throw new errors.DepSynkyError(
          `Package ${pkg.name} is public and cannot depend on local package ${name}. To keep reference on local package, make ${pkg.name} private.`
        )
      }
      if (!isLocal && currentVersion !== version) {
        throw new errors.DepSynkyError(
          `Dependency ${name} is out of sync in ${pkg.name}: ${currentVersion} != ${version}`
        )
      }
    }
  }

export const checkVersions = (argv: YargsConfig<typeof config.checkSchema>, opts: Partial<CheckVersionsOpts> = {}) => {
  const allPackages = utils.pnpm.searchWorkspaces(argv.rootDir)
  const targetVersions = opts.targetVersions ?? utils.pnpm.versions(allPackages)

  for (const { content } of allPackages) {
    const { dependencies, devDependencies, peerDependencies } = content

    const check = checker(content)
    check(dependencies, targetVersions)
    check(peerDependencies, targetVersions)
    !argv.ignoreDev && check(devDependencies, targetVersions)
  }

  logger.info('All versions are in sync')
}
