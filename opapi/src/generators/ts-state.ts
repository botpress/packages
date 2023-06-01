import pathlib from 'path'
import fs from 'fs'
import { State } from '../state'
import { tsFileHeader } from '../const'
import prettier from 'prettier'

export const exportStateAsTypescript = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
  dir: string,
): void => {
  fs.mkdirSync(dir, { recursive: true })

  const json = JSON.stringify(state, null, 2)

  const schemaNames = Object.keys(state.schemas)
  const paramNames = Object.keys(state.defaultParameters ?? {})
  const sectionNames = Object.values(state.sections).map((s) => s.name)

  const typeSchema = !schemaNames.length ? 'never' : schemaNames.map((s) => `'${s}'`).join(' | ')
  const typeParam = !paramNames.length ? 'never' : paramNames.map((s) => `'${s}'`).join(' | ')
  const typeSection = !sectionNames.length ? 'never' : sectionNames.map((s) => `'${s}'`).join(' | ')

  const header = `${tsFileHeader}/* prettier-ignore */\n`
  const imports = `import { State } from '@bpinternal/opapi'\n`
  const body = `export const state = ${json} satisfies State<${typeSchema}, ${typeParam}, ${typeSection}>\n`

  const formatted = prettier.format(body, { parser: 'typescript' })

  const ts = header + imports + formatted
  const path = pathlib.join(dir, 'state.ts')
  fs.writeFileSync(path, ts)
}
