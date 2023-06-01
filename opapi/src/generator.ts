import chalk from 'chalk'
import { VError } from 'verror'
import { defaultResponseStatus, invalidLine, tsFileHeader } from './const'
import { appendHeaders, initDirectory, removeLineFromFiles, saveFile } from './file'
import {
  generateClientCode,
  generateDefinition,
  GenerateHandlerProps,
  generateHandlers,
  generateTypes,
  runOpenApiCodeGenerator
} from './generators'
import { generateErrors } from './generators/errors'
import { generateOpenapiTypescript } from './generators/openapi-typescript'
import log from './log'
import type { OpenApiPostProcessors } from './opapi'
import { createOpenapi } from './openapi'
import { operationBodyTypeGuard } from './operation'
import type { Operation, State } from './state'
import { SchemaObject } from 'openapi3-ts'

export const generateServer = async (state: State<string, string, string>, dir: string, useExpressTypes: boolean) => {
  initDirectory(dir)

  log.info('Generating openapi content')
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
      mapOperationPropsToHandlerProps(name, operation)
    ),
    useExpressTypes
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

export const generateClient = async (
  state: State<string, string, string>,
  dir = '.',
  openApiGeneratorEndpoint: string,
  postProcessors?: OpenApiPostProcessors
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
      mapOperationPropsToHandlerProps(name, operation)
    )
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
  operation: Operation<string, string, string, SchemaObject>
) {
  const generateHandlerProps: GenerateHandlerProps = {
    operationName,
    operation,
    status: operation.response.status ?? defaultResponseStatus,
    headers: [],
    cookies: [],
    queries: [],
    params: [],
    body: operationBodyTypeGuard(operation) ? true : false
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
