import { YargsConfig, YargsSchema } from '@bpinternal/yargs-extra'

export type CommonConfig = YargsConfig<typeof defaultOptions>
const defaultOptions = {
  rootDir: {
    type: 'string',
    default: process.cwd()
  },
  ignoreDev: {
    type: 'boolean',
    description: 'Ignore dev dependencies',
    default: false
  },
  ignorePeers: {
    type: 'boolean',
    description: 'Ignore peer dependencies',
    default: false
  }
} satisfies YargsSchema

export type BumpConfig = YargsConfig<typeof bumpSchema> & { pkgName?: string }
export const bumpSchema = {
  ...defaultOptions,
  sync: {
    type: 'boolean',
    default: true
  }
} satisfies YargsSchema

export type SyncConfig = YargsConfig<typeof syncSchema>
export const syncSchema = {
  ...defaultOptions
} satisfies YargsSchema

export type CheckConfig = YargsConfig<typeof checkSchema>
export const checkSchema = {
  ...defaultOptions
} satisfies YargsSchema

export type ListConfig = YargsConfig<typeof listSchema>
export const listSchema = defaultOptions satisfies YargsSchema
