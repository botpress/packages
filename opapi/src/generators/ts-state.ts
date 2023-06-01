import pathlib from 'path'
import fs from 'fs'
import { State } from '../state'
import { tsFileHeader } from 'src/const'

export const exportStateAsTypescript = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
>(
  state: State<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>,
  dir: string
): void => {
  const json = JSON.stringify(state, null, 2)

  const header = `${tsFileHeader}/* prettier-ignore */\n`
  const body = `export const state = ${json} as const`

  // TODO: run prettier on the generated body

  const ts = header + body
  const path = pathlib.join(dir, 'state.ts')
  fs.writeFileSync(path, ts)
}
