import pathlib from 'path'
import fs from 'fs'
import { State } from '../state'
import { tsFileHeader } from '../const'

const DEFAULT_IMPORT_PATH = '@bpinternal/opapi'

export type ExportStateAsTypescriptOptions = Partial<{ importPath: string }>
export const exportStateAsTypescript = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
  dir: string,
  opts: ExportStateAsTypescriptOptions = {},
): void => {
  fs.mkdirSync(dir, { recursive: true })

  const json = JSON.stringify(state, null, 2)

  const schemaNames = Object.keys(state.schemas)
  const paramNames = Object.keys(state.defaultParameters ?? {})
  const sectionNames = Object.values(state.sections).map((s) => s.name)

  const typeSchema = !schemaNames.length ? 'never' : schemaNames.map((s) => `'${s}'`).join(' | ')
  const typeParam = !paramNames.length ? 'never' : paramNames.map((s) => `'${s}'`).join(' | ')
  const typeSection = !sectionNames.length ? 'never' : sectionNames.map((s) => `'${s}'`).join(' | ')

  const importPath = opts.importPath ?? DEFAULT_IMPORT_PATH

  const header = `${tsFileHeader}/* prettier-ignore */\n`
  const content = [
    `import * as opapi from '${importPath}'`,
    `export type State = opapi.State<${typeSchema}, ${typeParam}, ${typeSection}>`,
    `export const state = ${json} satisfies State`,
  ].join('\n')

  const ts = header + content
  const path = pathlib.join(dir, 'state.ts')
  fs.writeFileSync(path, ts)
}
