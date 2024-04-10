import fs from 'fs'
import pathlib from 'path'
import { State } from '../state'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { exportErrors } from './export-errors'
import { exportTypings } from './export-typings'
import { exportRouteTree } from './export-tree'
import { exportSchemas } from './export-schemas'
import { JSONSchema7 } from 'json-schema'
import { exportHandler } from './export-handler'
import { generateOpenapi } from '../generator'
import _ from 'lodash'

type SchemaMap = Record<string, JSONSchema7>

type ExportableSchema<T extends SchemaMap> = {
  exportSchemas: (outDir: string) => Promise<void>
  getSchemas: () => T
}

const toExportableSchema = <T extends SchemaMap>(schemas: T): ExportableSchema<T> => ({
  exportSchemas: (outDir: string) => exportSchemas(schemas)(outDir),
  getSchemas: () => schemas,
})

export type IntegrationHandlerProps<Schema extends string, Param extends string, Section extends string> = {
  state: State<Schema, Param, Section>
  signals: SchemaMap
}

export const exportIntegrationHandler = <Param extends string, Section extends string, Path extends string>(
  props: IntegrationHandlerProps<Param, Section, Path>,
) => {
  const operationsByName = _.mapKeys(props.state.operations, (v) => v.name)
  const requestSchemas: SchemaMap = _.mapValues(operationsByName, (o) => toRequestSchema(o))
  const responseSchemas: SchemaMap = _.mapValues(operationsByName, (o) => toResponseSchema(o))
  const modelSchemas: SchemaMap = _.mapValues(props.state.schemas, (s) => s.schema as JSONSchema7)

  const errorsGenerator = exportErrors(props.state.errors ?? [])
  const typingsGenerator = exportTypings(props.state.operations)
  const treeGenerator = exportRouteTree(props.state.operations)
  const models = toExportableSchema(modelSchemas)
  const signals = toExportableSchema(props.signals)
  const requests = toExportableSchema(requestSchemas)
  const responses = toExportableSchema(responseSchemas)

  return {
    models,
    signals,
    requests,
    responses,
    exportIntegrationHandler: async (outDir: string) => {
      fs.mkdirSync(outDir, { recursive: true })

      const errorFile = pathlib.join(outDir, 'errors.ts')
      await errorsGenerator(errorFile)

      const modelsOutDir = pathlib.join(outDir, 'models')
      await models.exportSchemas(modelsOutDir)

      const signalsOutDir = pathlib.join(outDir, 'signals')
      await signals.exportSchemas(signalsOutDir)

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

      generateOpenapi(props.state, outDir)
    },
  }
}
