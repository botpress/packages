import { YargsConfig } from '@bpinternal/yargs-extra'
import * as fs from 'fs'
import * as path from 'path'
import * as config from './config'
import * as consts from './consts'

export const generate = async (args: YargsConfig<typeof config.genCmd>) => {
  const tsFileLines: string[] = [consts.HEADER]

  for (const envVarName of args.env) {
    const envVarValue = process.env[envVarName] ?? `$${envVarName}`
    tsFileLines.push(`export const ${envVarName} = ${JSON.stringify(envVarValue)}`)
  }

  const tsFileContent = tsFileLines.join('\n')

  const outdir = path.dirname(args.outFile)
  await fs.promises.mkdir(outdir, { recursive: true })
  await fs.promises.writeFile(args.outFile, tsFileContent)
}
