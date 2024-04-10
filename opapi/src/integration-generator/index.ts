import fs from 'fs'
import pathlib from 'path'
import { State } from '../state'
import { zodToJsonSchema } from '@bpinternal/zod-to-json-schema'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { exportErrors } from './export-errors'
import { exportTypings } from './export-typings'
import { exportRouteTree } from './export-tree'
import { exportSchemas } from './export-schemas'
import { JSONSchema7 } from 'json-schema'
import { exportHandler } from './export-handler'
import { generateOpenapi } from '../generator'
import _ from 'lodash'
import { z } from 'zod'

type JsonSchemaMap = Record<string, JSONSchema7>
type ZodSchemaMap = Record<string, z.ZodTypeAny>
type ExportableSchema = { exportSchemas: (outDir: string) => Promise<void> }

const toExportableSchema = (schemas: JsonSchemaMap): ExportableSchema => ({
  exportSchemas: (outDir: string) => exportSchemas(schemas)(outDir),
})

export type ExportIntegrationHandlerInput<Custom extends string> = {
  customSchemas: Record<Custom, ZodSchemaMap>
}

export type ExportIntegrationHandlerOutput<Custom extends string> = Record<
  Custom | 'models' | 'requests' | 'responses',
  ExportableSchema
> & {
  exportIntegrationHandler: (outDir: string) => Promise<void>
}

export const integrationHandlerExporter =
  <Schema extends string, Param extends string, Section extends string, Custom extends string>(
    state: State<Schema, Param, Section>,
  ) =>
  (input: ExportIntegrationHandlerInput<Custom>): ExportIntegrationHandlerOutput<Custom> => {
    const { customSchemas } = input

    const operationsByName = _.mapKeys(state.operations, (v) => v.name)
    const requestSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toRequestSchema(o))
    const responseSchemas: JsonSchemaMap = _.mapValues(operationsByName, (o) => toResponseSchema(o))
    const modelSchemas: JsonSchemaMap = _.mapValues(state.schemas, (s) => s.schema as JSONSchema7)

    const errorsGenerator = exportErrors(state.errors ?? [])
    const typingsGenerator = exportTypings(state.operations)
    const treeGenerator = exportRouteTree(state.operations)
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
      exportIntegrationHandler: async (outDir: string) => {
        fs.mkdirSync(outDir, { recursive: true })

        const errorFile = pathlib.join(outDir, 'errors.ts')
        await errorsGenerator(errorFile)

        const modelsOutDir = pathlib.join(outDir, 'models')
        await models.exportSchemas(modelsOutDir)

        for (const [name, schemas] of Object.entries(customs)) {
          const signalsOutDir = pathlib.join(outDir, name)
          await (schemas as ExportableSchema).exportSchemas(signalsOutDir)
        }

        const requestsOutDir = pathlib.join(outDir, 'requests')
        await requests.exportSchemas(requestsOutDir)

        const responsesOutDir = pathlib.join(outDir, 'responses')
        await responses.exportSchemas(responsesOutDir)

        const typingsOutFile = pathlib.join(outDir, 'typings.ts')
        await typingsGenerator(typingsOutFile)

        const treeOutFile = pathlib.join(outDir, 'tree.ts')
        await treeGenerator(treeOutFile)

        const handlerFile = pathlib.join(outDir, 'handler.ts')
        await exportHandler(handlerFile)

        generateOpenapi(state, outDir)
      },
    }
  }
