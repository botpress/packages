import { YargsSchema } from '@bpinternal/yargs-extra'

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

export const bumpSchema = {
  ...defaultOptions,
  sync: {
    type: 'boolean',
    default: true
  }
} satisfies YargsSchema

export const syncSchema = {
  ...defaultOptions
} satisfies YargsSchema

export const checkSchema = {
  ...defaultOptions
} satisfies YargsSchema

export const listSchema = defaultOptions satisfies YargsSchema
