import { YargsConfig } from '@bpinternal/yargs-extra'
import * as prompts from 'prompts'
import * as config from '../config'
import * as errors from '../errors'
import { bootstrap } from '../bootstrap'

const promptPackage = async (publicPkgs: string[]): Promise<string> => {
  if (publicPkgs.length === 0) {
    throw new errors.DepSynkyError('No public packages found')
  }

  const { pkgName } = await prompts.prompt({
    type: 'select',
    name: 'pkgName',
    message: 'Select a package to bump',
    choices: publicPkgs.map((name) => ({ title: name, value: name }))
  })

  if (!pkgName) {
    throw new errors.DepSynkyError('No package selected')
  }

  return pkgName
}

export const bumpVersion = async (argv: YargsConfig<typeof config.bumpSchema> & { pkgName?: string }) => {
  const { app, pnpm } = await bootstrap(argv)

  let pkgName = argv.pkgName
  if (!pkgName) {
    const publicPkgs = await pnpm.listPublicPackages()
    pkgName = await promptPackage(publicPkgs)
  }

  await app.bumpVersion({ pkgName, ...argv })
}
