import fs from 'fs'
import pathlib from 'path'
import { ApiError, Operation } from '../state'
import * as utils from './utils'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { exportErrors } from './export-errors'
import { exportTypings } from './export-typings'
import { exportRouteTree } from './export-tree'
import { exportSchemas } from './export-schemas'
import { z } from 'zod'
import { exportHandler } from './export-handler'

type ZodMap = Record<string, z.AnyZodObject>

type ExportableSchema<T extends ZodMap> = {
  exportSchemas: (outDir: string) => Promise<void>
  getSchemas: () => T
}

const toExportableSchema = <T extends ZodMap>(schemas: T): ExportableSchema<T> => ({
  exportSchemas: (outDir: string) => exportSchemas(schemas)(outDir),
  getSchemas: () => schemas,
})

export type IntegrationHandlerProps<Param extends string, Section extends string, Path extends string> = {
  errors: ApiError[]
  operations: Record<string, Operation<Param, Section, Path, 'zod-schema'>>
  models: ZodMap
  signals: ZodMap
}

/**
 * This function is highly experimental and should be used with caution.
 * It will be added to the main OpenApi type when it's more stable.
 */
export const exportIntegrationHandler = <Param extends string, Section extends string, Path extends string>(
  props: IntegrationHandlerProps<Param, Section, Path>,
) => {
  const operationsByName = utils.mapKeys(props.operations, (_, v) => v.name)
  const requestSchemas = utils.mapValues(operationsByName, (o) => toRequestSchema(o))
  const responseSchemas = utils.mapValues(operationsByName, (o) => toResponseSchema(o))

  const errorsGenerator = exportErrors(props.errors)
  const typingsGenerator = exportTypings(props.operations)
  const treeGenerator = exportRouteTree(props.operations)
  const models = toExportableSchema(props.models)
  const signals = toExportableSchema(props.signals)
  const requests = toExportableSchema(requestSchemas)
  const responses = toExportableSchema(responseSchemas)

  return async (outDir: string) => {
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
  }
}
