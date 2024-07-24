import fs from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { State } from '../state'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { exportErrors } from './export-errors'
import { exportTypings } from './export-typings'
import { exportRouteTree } from './export-tree'
import { exportJsonSchemas } from './export-schemas'
import { JSONSchema7 } from 'json-schema'
import { exportHandler } from './export-handler'
import { generateOpenapi } from '../generator'

type JsonSchemaMap = Record<string, JSONSchema7>
type ExportableSchema = { exportSchemas: (outDir: string) => Promise<void> }

const toExportableSchema = (schemas: JsonSchemaMap): ExportableSchema => ({
  exportSchemas: (outDir: string) => exportJsonSchemas(schemas)(outDir, { includeZodSchemas: false }),
})

export const generateHandler = async <Schema extends string, Param extends string, Section extends string>(
  state: State<Schema, Param, Section>,
  outDir: string,
) => {
  const operationsByName = _.mapKeys(state.operations, (v) => v.name)

  const requestSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toRequestSchema(state, o))
  const responseSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toResponseSchema(state, o))
  const modelSchemas: JsonSchemaMap = _.mapValues(state.schemas, (s) => s.schema as JSONSchema7)

  const models: ExportableSchema = toExportableSchema(modelSchemas)
  const requests: ExportableSchema = toExportableSchema(requestSchemas)
  const responses: ExportableSchema = toExportableSchema(responseSchemas)

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
