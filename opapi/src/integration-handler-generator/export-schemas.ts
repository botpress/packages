import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { jsonSchemaToZod } from 'json-schema-to-zod'
import { compile } from 'json-schema-to-typescript'
import * as utils from './utils'
import pathlib from 'path'
import fs from 'fs/promises'

type jsonSchemaToZodInput = Parameters<typeof jsonSchemaToZod>[0]
type jsonSchemaToTsInput = Parameters<typeof compile>[0]
type Module = { name: string; filename: string }

export const exportSchemas = (schemas: Record<string, z.AnyZodObject>) => async (outDir: string) => {
  await fs.mkdir(outDir, { recursive: true })

  const zodFiles: Module[] = []
  const jsonFiles: Module[] = []
  const typeFiles: Module[] = []

  for (const schema of Object.entries(schemas)) {
    const [name, zodSchema] = schema
    const jsonSchema = zodToJsonSchema(zodSchema, { $refStrategy: 'none' })

    // json file
    const jsonFileName = `${name}.j`
    const jsonCode = `export default ${JSON.stringify(jsonSchema, null, 2)}`
    const jsonFilePath = pathlib.join(outDir, `${jsonFileName}.ts`)
    await fs.writeFile(jsonFilePath, jsonCode)
    jsonFiles.push({ name, filename: jsonFileName })

    // zod file
    const zodFileName = `${name}.z`
    const zodCode = jsonSchemaToZod(jsonSchema as jsonSchemaToZodInput).replaceAll('.catchall(z.never())', '')
    const zodFilePath = pathlib.join(outDir, `${zodFileName}.ts`)
    await fs.writeFile(zodFilePath, zodCode)
    zodFiles.push({ name, filename: zodFileName })

    // type file
    const typeFileName = `${name}.t`
    const typeCode = await compile(jsonSchema as jsonSchemaToTsInput, name, { unknownAny: false })
    const typeFilePath = pathlib.join(outDir, `${typeFileName}.ts`)
    await fs.writeFile(typeFilePath, typeCode)
    typeFiles.push({ name, filename: typeFileName })
  }

  // index file
  const indexCode = [
    ...zodFiles.map(({ name, filename }) => `import zod_${name} from './${filename}'`),
    ...jsonFiles.map(({ name, filename }) => `import json_${name} from './${filename}'`),
    ...typeFiles.map(
      ({ name, filename }) => `import type { ${utils.casing.to.pascalCase(name)} } from './${filename}'`,
    ),
    '',
    `export const zod = {`,
    ...zodFiles.map(({ name }) => `  ${name}: zod_${name},`),
    `}`,
    '',
    `export const json = {`,
    ...jsonFiles.map(({ name }) => `  ${name}: json_${name},`),
    `}`,
    '',
    `export type Types = {`,
    ...typeFiles.map(({ name }) => `  ${name}: ${utils.casing.to.pascalCase(name)}`),
    `}`,
  ].join('\n')

  const indexPath = pathlib.join(outDir, 'index.ts')
  await fs.writeFile(indexPath, indexCode)
}
