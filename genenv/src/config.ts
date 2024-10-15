import { YargsSchema } from '@bpinternal/yargs-extra'

export const genCmd = {
  outFile: {
    alias: 'o',
    type: 'string',
    description: 'Generated file path',
    demandOption: true,
  },
  env: {
    alias: 'e',
    description: 'Environment variables to include in the generated file',
    type: 'string',
    array: true,
    default: [] satisfies string[],
  },
} satisfies YargsSchema
