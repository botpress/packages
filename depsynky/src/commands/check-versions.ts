import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import { bootstrap } from '../bootstrap'

export const checkVersions = async (argv: YargsConfig<typeof config.checkSchema>) => {
  const { app } = await bootstrap(argv)
  await app.checkVersions({ ...argv })
}
