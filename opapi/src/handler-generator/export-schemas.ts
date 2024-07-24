import { JSONSchema7 } from 'json-schema'
import { compile } from 'json-schema-to-typescript'
import * as jsonschema from '../jsonschema'
import * as utils from './utils'
import pathlib from 'path'
import fs from 'fs/promises'
import { jsonSchemaToZod } from 'json-schema-to-zod'
import { OpenApiZodAny } from '@anatine/zod-openapi'

type jsonSchemaToZodInput = Parameters<typeof jsonSchemaToZod>[0]
type jsonSchemaToTsInput = Parameters<typeof compile>[0]
type Module = { name: string; filename: string }
type ExportSchemasOptions = {
  includeJsonSchemas: boolean
  includeZodSchemas: boolean
  includeTypes: boolean
}

const jsonSchemaToTs = async (originalSchema: JSONSchema7, name: string): Promise<string> => {
  let { title, ...schema } = originalSchema
  schema = jsonschema.setDefaultAdditionalProperties(schema, false)

  const typeCode = await compile(schema as jsonSchemaToTsInput, name, {
    unknownAny: false,
    bannerComment: '',
    additionalProperties: false,
    ignoreMinAndMaxItems: true,
  })

  return `${typeCode}\n`
}

const zodToJsonSchema = (zodSchema: OpenApiZodAny): JSONSchema7 => {
  let jsonSchema = jsonschema.generateSchemaFromZod(zodSchema, { allowUnions: true }) as JSONSchema7
  jsonSchema = jsonschema.replaceNullableWithUnion(jsonSchema)
  jsonSchema = jsonschema.replaceOneOfWithAnyOf(jsonSchema)
  return jsonSchema
}

const DEFAULT_OPTIONS: ExportSchemasOptions = {
  includeJsonSchemas: true,
  includeZodSchemas: true,
  includeTypes: true,
}

/**
 * export any record of json schema to:
 * - json schemas
 * - zod schemas
 * - typescript types
 *
 * allows fully separating build time schemas from the ones used at runtime
 */
export const exportJsonSchemas =
  (schemas: Record<string, JSONSchema7>) =>
  async (outDir: string, opts: Partial<ExportSchemasOptions> = {}) => {
    const options = { ...DEFAULT_OPTIONS, ...opts }
    await fs.mkdir(outDir, { recursive: true })

    const jsonFiles: Module[] = []
    const zodFiles: Module[] = []
    const typeFiles: Module[] = []

    for (const [name, schema] of Object.entries(schemas)) {
      const jsonSchema = jsonschema.replaceNullableWithUnion(schema)

      // json file
      if (options.includeJsonSchemas) {
        const jsonFileName = `${name}.j`
        const jsonCode = [
          "import type { JSONSchema7 } from 'json-schema'",
          `const schema: JSONSchema7 = ${JSON.stringify(jsonSchema, null, 2)}`,
          `export default schema`,
        ].join('\n')
        const jsonFilePath = pathlib.join(outDir, `${jsonFileName}.ts`)
        await fs.writeFile(jsonFilePath, jsonCode)
        jsonFiles.push({ name, filename: jsonFileName })
      }

      // zod file
      if (options.includeZodSchemas) {
        const zodFileName = `${name}.z`
        const zodCode = jsonSchemaToZod(jsonSchema as jsonSchemaToZodInput).replace(/\.catchall\(z\.never\(\)\)/g, '')
        const zodFilePath = pathlib.join(outDir, `${zodFileName}.ts`)
        await fs.writeFile(zodFilePath, zodCode)
        zodFiles.push({ name, filename: zodFileName })
      }

      // type file
      if (options.includeTypes) {
        const typeFileName = `${name}.t`
        const typeCode = await jsonSchemaToTs(jsonSchema, name)
        const typeFilePath = pathlib.join(outDir, `${typeFileName}.ts`)
        await fs.writeFile(typeFilePath, typeCode)
        typeFiles.push({ name, filename: typeFileName })
      }
    }

    // index file
    const indexCode = [
      ...jsonFiles.map(({ name, filename }) => `import json_${name} from './${filename}'`),
      ...zodFiles.map(({ name, filename }) => `import zod_${name} from './${filename}'`),
      ...typeFiles.map(({ name, filename }) => `import type { ${utils.pascalCase(name)} } from './${filename}'`),
      '',
      `export const json = {`,
      ...jsonFiles.map(({ name }) => `  ${name}: json_${name},`),
      `}`,
      '',
      `export const zod = {`,
      ...zodFiles.map(({ name }) => `  ${name}: zod_${name},`),
      `}`,
      '',
      `export type Types = {`,
      ...typeFiles.map(({ name }) => `  ${name}: ${utils.pascalCase(name)}`),
      `}`,
    ].join('\n')

    const indexPath = pathlib.join(outDir, 'index.ts')
    await fs.writeFile(indexPath, indexCode)
  }

/**
 * export any record of zod schema to:
 * - json schemas
 * - zod schemas
 * - typescript types
 *
 * allows fully separating build time schemas from the ones used at runtime
 */
export const exportZodSchemas = (schemas: Record<string, OpenApiZodAny>) => {
  const jsonSchemas = Object.entries(schemas).reduce(
    (acc, [name, zodSchema]) => {
      return {
        ...acc,
        [name]: zodToJsonSchema(zodSchema),
      }
    },
    {} as Record<string, JSONSchema7>,
  )
  return exportJsonSchemas(jsonSchemas)
}
