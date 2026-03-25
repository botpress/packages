import { YargsConfig } from '@bpinternal/yargs-extra'
import * as util from 'util'
import * as config from '../config'
import * as utils from '../utils'
import { bootstrap } from '../bootstrap'

const { logger } = utils.logging

export const listVersions = async (argv: YargsConfig<typeof config.listSchema>) => {
  const { app } = await bootstrap(argv)
  const versions = await app.listVersions()
  logger.info('versions:', util.inspect(versions, { depth: Infinity, colors: true }))
}
