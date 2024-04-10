import fs from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { z } from 'zod'
import { State } from '../state'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { exportErrors } from './export-errors'
import { exportTypings } from './export-typings'
import { exportRouteTree } from './export-tree'
import { exportSchemas } from './export-schemas'
import { JSONSchema7 } from 'json-schema'
import { exportHandler } from './export-handler'
import { generateOpenapi } from '../generator'

type JsonSchemaMap = Record<string, JSONSchema7>
type ZodSchemaMap = Record<string, z.ZodTypeAny>
type ExportableSchema = { exportSchemas: (outDir: string) => Promise<void> }

const toExportableSchema = (schemas: JsonSchemaMap): ExportableSchema => ({
  exportSchemas: (outDir: string) => exportSchemas(schemas)(outDir),
})

export type GetSchemasInput<Custom extends string> = Record<Custom, ZodSchemaMap>

export type GetSchemasOutput<Custom extends string> = Record<
  Custom | 'models' | 'requests' | 'responses',
  ExportableSchema
>

export const getSchemas =
  <Schema extends string, Param extends string, Section extends string>(state: State<Schema, Param, Section>) =>
  <Custom extends string>(customSchemas: GetSchemasInput<Custom>): GetSchemasOutput<Custom> => {
    const operationsByName = _.mapKeys(state.operations, (v) => v.name)
    const requestSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toRequestSchema(o))
    const responseSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toResponseSchema(o))
    const modelSchemas: JsonSchemaMap = _.mapValues(state.schemas, (s) => s.schema as JSONSchema7)

    const models: ExportableSchema = toExportableSchema(modelSchemas)
    const requests: ExportableSchema = toExportableSchema(requestSchemas)
    const responses: ExportableSchema = toExportableSchema(responseSchemas)

    const customs: Record<Custom, ExportableSchema> = _.mapValues(customSchemas, (zodSchemas) => {
      const jsonSchemas = _.mapValues(zodSchemas, (s) => zodToJsonSchema(s) as JSONSchema7)
      return toExportableSchema(jsonSchemas)
    })

    return {
      models,
      requests,
      responses,
      ...customs,
    }
  }

export const generateIntegrationHandler = async <Schema extends string, Param extends string, Section extends string>(
  state: State<Schema, Param, Section>,
  outDir: string,
) => {
  const { models, requests, responses } = getSchemas(state)({ customSchemas: {} })
  const errorsGenerator = exportErrors(state.errors ?? [])
  const typingsGenerator = exportTypings(state.operations)
  const treeGenerator = exportRouteTree(state.operations)

  fs.mkdirSync(outDir, { recursive: true })

  console.log('Generating error file')
  const errorFile = pathlib.join(outDir, 'errors.ts')
  await errorsGenerator(errorFile)

  console.log('Generating models out directory')
  const modelsOutDir = pathlib.join(outDir, 'models')
  await models.exportSchemas(modelsOutDir)

  console.log('Generating requests out directory')
  const requestsOutDir = pathlib.join(outDir, 'requests')
  await requests.exportSchemas(requestsOutDir)

  console.log('Generating responses out directory')
  const responsesOutDir = pathlib.join(outDir, 'responses')
  await responses.exportSchemas(responsesOutDir)

  console.log('Generating typings out file')
  const typingsOutFile = pathlib.join(outDir, 'typings.ts')
  await typingsGenerator(typingsOutFile)

  console.log('Generating tree out file')
  const treeOutFile = pathlib.join(outDir, 'tree.ts')
  await treeGenerator(treeOutFile)

  console.log('Generating handler file')
  const handlerFile = pathlib.join(outDir, 'handler.ts')
  await exportHandler(handlerFile)

  generateOpenapi(state, outDir)
}
