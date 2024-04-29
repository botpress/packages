import { JSONSchema7 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import * as jsonschema from '../jsonschema'
import * as utils from './utils'
import pathlib from 'path'
import fs from 'fs/promises'

type Module = { name: string; filename: string }

const fixSchema = (schema: JSONSchema7): JSONSchema7 => {
  schema = jsonschema.replaceNullableWithUnion(schema as jsonschema.NullableJsonSchema)
  schema = jsonschema.setDefaultAdditionalProperties(schema, false)
  return schema
}

const toTs = async (originalSchema: JSONSchema7, name: string): Promise<string> => {
  let { title, ...schema } = originalSchema
  schema = fixSchema(schema)

  type jsonSchemaToTsInput = Parameters<typeof compile>[0]
  const typeCode = await compile(schema as jsonSchemaToTsInput, name, {
    unknownAny: false,
    bannerComment: '',
    additionalProperties: false,
    ignoreMinAndMaxItems: true,
  })

  return `${typeCode}\n`
}

export const exportSchemas = (schemas: Record<string, JSONSchema7>) => async (outDir: string) => {
  await fs.mkdir(outDir, { recursive: true })

  const jsonFiles: Module[] = []
  const typeFiles: Module[] = []

  for (const schema of Object.entries(schemas)) {
    const [name, jsonSchema] = schema

    // json file
    const jsonFileName = `${name}.j`
    const jsonCode = [
      "import type { JSONSchema7 } from 'json-schema'",
      `const schema: JSONSchema7 = ${JSON.stringify(jsonSchema, null, 2)}`,
      `export default schema`,
    ].join('\n')
    const jsonFilePath = pathlib.join(outDir, `${jsonFileName}.ts`)
    await fs.writeFile(jsonFilePath, jsonCode)
    jsonFiles.push({ name, filename: jsonFileName })

    // type file
    const typeFileName = `${name}.t`
    const typeCode = await toTs(jsonSchema, name)
    const typeFilePath = pathlib.join(outDir, `${typeFileName}.ts`)
    await fs.writeFile(typeFilePath, typeCode)
    typeFiles.push({ name, filename: typeFileName })
  }

  // index file
  const indexCode = [
    ...jsonFiles.map(({ name, filename }) => `import json_${name} from './${filename}'`),
    ...typeFiles.map(({ name, filename }) => `import type { ${utils.pascalCase(name)} } from './${filename}'`),
    '',
    `export const json = {`,
    ...jsonFiles.map(({ name }) => `  ${name}: json_${name},`),
    `}`,
    '',
    `export type Types = {`,
    ...typeFiles.map(({ name }) => `  ${name}: ${utils.pascalCase(name)}`),
    `}`,
  ].join('\n')

  const indexPath = pathlib.join(outDir, 'index.ts')
  await fs.writeFile(indexPath, indexCode)
}
