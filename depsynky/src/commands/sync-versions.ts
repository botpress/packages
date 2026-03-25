import { YargsConfig } from '@bpinternal/yargs-extra'
import * as config from '../config'
import { bootstrap } from '../bootstrap'

export const syncVersions = async (argv: YargsConfig<typeof config.syncSchema>) => {
  const { app } = await bootstrap(argv)
  await app.checkVersions({ ...argv })
}
