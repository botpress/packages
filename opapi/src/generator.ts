import pathlib from 'path'
import fslib from 'fs'
import chalk from 'chalk'
import _ from 'lodash'
import { VError } from 'verror'
import { defaultResponseStatus, invalidLine, tsFileHeader } from './const'
import { appendHeaders, initDirectory, removeLineFromFiles, saveFile } from './file'
import {
  GenerateHandlerProps,
  generateClientCode,
  generateDefinition,
  generateHandlers,
  generateTypes,
  runOpenApiCodeGenerator,
  clientNode,
} from './generators'
import { generateErrors } from './generators/errors'
import { generateOpenapiTypescript } from './generators/openapi-typescript'
import { schemaIsEmptyObject } from './jsonschema'
import log from './log'
import type { OpenApiPostProcessors } from './opapi'
import { createOpenapi } from './openapi'
import {
  DefaultState,
  composeFilesFromBlocks,
  executeOperationParsers,
  executeSectionParsers,
  operationParsers,
  sectionParsers,
} from './section-types-generator'
import { Block } from './section-types-generator/types'
import { ApiError, isOperationWithBodyProps, type Operation, type State } from './state'
import { generateSectionsFile } from './section-types-generator/generator'

/**
 * Generates files containing typescript types for each item in the state object - Sections, Operations, Responses, etc.
 */
export async function generateTypesBySection(state: DefaultState, targetDirectory: string) {
  initDirectory(targetDirectory)
  const allBlocks: Block[] = []
  for (const section of state.sections) {
    const [sectionBlocks, operationBlocks] = await Promise.all([
      executeSectionParsers(sectionParsers, section, state),
      executeOperationParsers(operationParsers, section, state),
    ])
    const blocks = [...sectionBlocks, ...operationBlocks]
    allBlocks.push(...blocks)
  }
  composeFilesFromBlocks(allBlocks, targetDirectory)
  generateSectionsFile(state, targetDirectory)
}

export const generateServer = async (state: State<string, string, string>, dir: string, useExpressTypes: boolean) => {
  initDirectory(dir)

  log.info('Generating OpenAPI content')
  const openapi = createOpenapi(state)
  const openapiSpecString = openapi.getSpecAsJson()
  const openapiSpec = JSON.parse(openapiSpecString)

  log.info('Generating metadata content')
  const metadata = JSON.stringify({ sections: state.sections, errors: state.errors ?? [] })

  log.info('Generating schema code')
  const openapiTypescriptSchemaCode = await generateOpenapiTypescript(openapiSpec)

  log.info('Generating types code')
  const typesCode = generateTypes(useExpressTypes)

  log.info('Generating definition code')
  const definitionCode = generateDefinition({ schemaTypes: Object.keys(state.schemas) })

  log.info('Generating handlers code')
  const handlersCode = generateHandlers({
    operations: Object.entries(state.operations).map(([name, operation]) =>
      mapOperationPropsToHandlerProps(name, operation),
    ),
    useExpressTypes,
  })
  log.info('')

  log.info('Generating error types')
  if (!state.errors || state.errors.length === 0) {
    throw new VError('No errors defined')
  }

  const errorCode = generateErrors(state.errors)
  log.info('')

  log.info('Saving generated files')
  saveFile(dir, 'metadata.json', metadata)
  saveFile(dir, 'openapi.json', openapiSpecString)
  saveFile(dir, 'schema.ts', openapiTypescriptSchemaCode)
  saveFile(dir, 'type.ts', typesCode)
  saveFile(dir, 'definition.ts', definitionCode)
  saveFile(dir, 'handlers.ts', handlersCode)
  saveFile(dir, 'errors.ts', errorCode)
  log.info('')

  log.info(`Appending header to typescript files in ${chalk.blue(dir)}`)
  appendHeaders(dir, tsFileHeader)
  log.info('')
}

export const generateClientWithOpenapiGenerator = async (
  state: State<string, string, string>,
  dir = '.',
  openApiGeneratorEndpoint: string,
  postProcessors?: OpenApiPostProcessors,
) => {
  initDirectory(dir)

  log.info('Generating OpenAPI content')
  const openapi = createOpenapi(state)
  const openapiSpecString = openapi.getSpecAsJson()
  const openapiSpec = JSON.parse(openapiSpecString)
  log.info('')

  log.info('Running OpenAPI code generator')
  await runOpenApiCodeGenerator(dir, openApiGeneratorEndpoint, openapiSpec, postProcessors?.apiCode)
  log.info('')

  log.info('Generating client code')
  const clientCode = generateClientCode({
    operations: Object.entries(state.operations).map(([name, operation]) =>
      mapOperationPropsToHandlerProps(name, operation),
    ),
  })
  log.info('')

  log.info('Generating error types')
  if (!state.errors || state.errors.length === 0) {
    throw new VError('No errors defined')
  }

  const errorsCode = generateErrors(state.errors)
  log.info('')

  log.info('Saving generated files')
  saveFile(dir, 'client.ts', clientCode)
  saveFile(dir, 'errors.ts', errorsCode)
  log.info('')

  log.info(`Appending header to typescript files in ${chalk.blue(dir)}`)
  appendHeaders(dir, tsFileHeader)
  log.info('')

  log.info('Removing invalid line from typescript files')
  removeLineFromFiles(dir, invalidLine)
  log.info('')
}

export const generateClientWithOpapi = async (state: State<string, string, string>, dir: string) => {
  initDirectory(dir)

  const modelsFile = pathlib.join(dir, 'models.ts')
  const errorsFile = pathlib.join(dir, 'errors.ts')
  const indexFile = pathlib.join(dir, 'index.ts')
  const operationsDir = pathlib.join(dir, 'operations')
  const toAxiosFile = pathlib.join(dir, 'to-axios.ts')
  fslib.mkdirSync(operationsDir, { recursive: true })

  log.info('Generating models')
  await clientNode.generateModels(state, modelsFile)

  log.info('Generating operations')
  await clientNode.generateOperations(state, operationsDir)

  log.info('Generating errors file')
  const errorsFileContent = generateErrors(state.errors ?? [])
  await fslib.promises.writeFile(errorsFile, errorsFileContent)

  log.info('Generating to-axios file')
  await clientNode.generateToAxios(toAxiosFile)

  log.info('Generating index file')
  await clientNode.generateIndex(state, indexFile)
}

export function generateErrorsFile(errors: ApiError[], dir = '.') {
  initDirectory(dir)

  log.info('Generating error types')
  if (!errors || errors.length === 0) {
    throw new VError('No errors defined')
  }

  const errorCode = generateErrors(errors)
  log.info('')

  log.info('Saving generated files')
  saveFile(dir, 'errors.ts', errorCode)
  log.info('')

  log.info(`Appending header to typescript files in ${chalk.blue(dir)}`)
  appendHeaders(dir, tsFileHeader)
  log.info('')

  log.info('Removing invalid line from typescript files')
  removeLineFromFiles(dir, invalidLine)
  log.info('')
}

export function generateOpenapi(state: State<string, string, string>, dir = '.') {
  initDirectory(dir)

  log.info('Generating openapi content')
  const openapi = createOpenapi(state)
  const openapiSpecString = openapi.getSpecAsJson()

  log.info('Generating metadata content')
  const metadata = JSON.stringify({ sections: state.sections, errors: state.errors ?? [] })

  log.info('Saving generated files')
  saveFile(dir, 'metadata.json', metadata)
  saveFile(dir, 'openapi.json', openapiSpecString)
  log.info('')
}

function mapOperationPropsToHandlerProps(
  operationName: string,
  operation: Operation<string, string, string, 'json-schema'>,
) {
  const generateHandlerProps: GenerateHandlerProps = {
    operationName,
    operation,
    status: operation.response.status ?? defaultResponseStatus,
    headers: [],
    cookies: [],
    queries: [],
    params: [],
    body: isOperationWithBodyProps(operation) ? true : false,
    isEmptyBody: isOperationWithBodyProps(operation) ? schemaIsEmptyObject(operation.requestBody.schema) : true,
    contentType: isOperationWithBodyProps(operation)
      ? (operation.contentType ?? 'application/json')
      : 'application/json',
  }

  if (operation.parameters) {
    Object.entries(operation.parameters)?.forEach(([name, parameter]) => {
      const parameterIn = parameter.in

      switch (parameterIn) {
        case 'header':
          generateHandlerProps.headers.push({ name, parameter })
          break
        case 'cookie':
          generateHandlerProps.cookies.push({ name, parameter })
          break
        case 'query':
          generateHandlerProps.queries.push({ name, parameter })
          break
        case 'path':
          generateHandlerProps.params.push({ name, parameter })
          break
        default:
          throw new VError(`Parameter in "${parameterIn}" is not supported`)
      }
    })
  }

  return generateHandlerProps
}
