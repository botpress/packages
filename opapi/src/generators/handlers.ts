import {
  type Parameter as OpenApiParameter,
  type StandardParameter,
  type QueryParameterStringArray,
  type QueryParameterObject,
  type PathParameter,
  type Operation,
  type BooleanParameter,
  type IntegerParameter,
  type NumberParameter,
} from '../state'

export type GenerateHandlersProps = {
  operations: GenerateHandlerProps[]
  useExpressTypes: boolean
}

export const generateHandlers = ({ operations, useExpressTypes }: GenerateHandlersProps) => `
${generateRequestResponseTypes(useExpressTypes)}
import type { Operations, Handlers } from './definition'
import type { components } from './schema'

${operations.map((operation) => generateHandler(operation)).join('\n')}

${generateResolver(operations)}
`

type Parameter<P> = {
  name: string
  parameter: P
}

export type GenerateHandlerProps = {
  operationName: string
  operation: Operation<string, string, string, 'json-schema'>
  headers: Parameter<StandardParameter | BooleanParameter | IntegerParameter | NumberParameter>[]
  cookies: Parameter<StandardParameter | BooleanParameter | IntegerParameter | NumberParameter>[]
  params: Parameter<PathParameter>[]
  queries: Parameter<
    | StandardParameter
    | BooleanParameter
    | IntegerParameter
    | NumberParameter
    | QueryParameterStringArray
    | QueryParameterObject<'json-schema'>
  >[]
  status: number
  body: boolean
  isEmptyBody: boolean
  contentType: string
}

const generateRequestResponseTypes = (useExpressTypes: boolean) => {
  if (useExpressTypes) {
    return "import type { Request, Response } from 'express'"
  } else {
    return "import type { Request, Response } from './type'"
  }
}

const generateHandler = (props: GenerateHandlerProps) => {
  const responseFormat = props.operation.response?.format
  const responseContentType = props.operation.response?.contentType || 'application/json'

  // For streaming responses, use a different response pattern
  if (responseFormat === 'stream' || responseContentType === 'text/event-stream') {
    return `const ${props.operationName}Handler = (operation: Operations['${props.operationName}']) => async (req: Request, res: Response) => {
  const input = {
${generateParameterFields(props)}
  }

  const output = await operation(input, req)

  // For streaming responses, the operation should return the response handling
  // The operation is responsible for setting headers and writing to the response
  if (typeof output === 'object' && output && 'pipe' in output) {
    // Handle readable stream
    res.setHeader('Content-Type', '${responseContentType}')
    output.pipe(res)
  } else if (typeof output === 'function') {
    // Handle custom response function
    await output(res)
  } else {
    // Fallback to regular response
    res.status(${props.status}).setHeader('Content-Type', '${responseContentType}').send(output)
  }
}
`
  } else {
    // Regular JSON response
    return `const ${props.operationName}Handler = (operation: Operations['${props.operationName}']) => async (req: Request, res: Response) => {
  const input = {
${generateParameterFields(props)}
  }

  const output = await operation(input, req)

  res.status(${props.status}).json(output)
}
`
  }
}

const generateBodyField = (operationName: string, contentType: string) =>
  `\t\t...req.body as NonNullable<components['requestBodies']['${operationName}Body']>['content']['${contentType}'],`

const generateParameterFields = ({
  cookies,
  headers,
  params,
  queries,
  body,
  operationName,
  contentType,
}: GenerateHandlerProps): string =>
  [
    body ? generateBodyField(operationName, contentType) : undefined,
    ...cookies.map((cookie) =>
      generateField(cookie.name, 'cookies', cookie.parameter, cookie.parameter.required !== false),
    ),
    ...headers.map((header) =>
      generateField(header.name, 'headers', header.parameter, header.parameter.required !== false),
    ),
    ...queries.map((query) => generateField(query.name, 'query', query.parameter, query.parameter.required !== false)),
    ...params.map((param) => generateField(param.name, 'params', param.parameter, true)),
  ]
    .filter((v) => !!v)
    .join('\n')

type FieldType = 'headers' | 'cookies' | 'params' | 'query'

const generateField = (name: string, type: FieldType, parameter: OpenApiParameter<'json-schema'>, required: boolean) =>
  `\t\t'${name}': req.${type}['${name}'] ${generateTypeAnnotation(parameter, required)},`

const generateTypeAnnotation = (parameter: OpenApiParameter<'json-schema'>, required: boolean) => {
  let typeAnnotation = 'as unknown as'

  const parameterType = parameter.type

  switch (parameterType) {
    case 'string':
      if (parameter.enum) {
        typeAnnotation += ` ${generateEnumType(parameter.enum)}`
      } else {
        typeAnnotation += ' string'
      }
      break
    case 'string[]':
      if (parameter.enum) {
        typeAnnotation += ` (${generateEnumType(parameter.enum)})[]`
      } else {
        typeAnnotation += ' string[]'
      }
      break
    case 'object':
      typeAnnotation += ' any'
      break
    case 'boolean':
      typeAnnotation += ' boolean'
      break
    case 'integer':
      typeAnnotation += ' number'
      break
    case 'number':
      typeAnnotation += ' number'
      break
    default:
      throw new Error(`Unsupported parameter type: ${parameterType}`)
  }

  if (!required) {
    typeAnnotation += ' | undefined'
  }

  return typeAnnotation
}

const generateEnumType = (enums: readonly string[]) => `${enums.map((enumName) => `'${enumName}'`).join(' | ')}`

type HandlerObject = {
  [path: string]: {
    [method: string]: string
  }
}

const generateResolver = (operations: GenerateHandlerProps[]) => {
  const handlerObject: HandlerObject = {}

  operations.forEach((operation) => {
    if (!handlerObject[operation.operation.path]) {
      handlerObject[operation.operation.path] = {}
    }

    if (handlerObject[operation.operation.path]![operation.operation.method]) {
      throw new Error(
        `Duplicate operation ${operation.operationName}: ${operation.operation.method} ${operation.operation.path}`,
      )
    }

    handlerObject[operation.operation.path]![operation.operation.method] = operation.operationName
  })

  return `export const Resolver = (operations: Operations): Handlers => ({
${Object.entries(handlerObject)
  .map(([path, methods]) => generatePathResolver(path, methods))
  .join('\n')}
})`
}

const generatePathResolver = (path: string, methods: { [method: string]: string }) => `\t'${path}': {
${Object.entries(methods)
  .map(([method, operationName]) => generateMethodResolver(method, operationName))
  .join('\n')}
\t},`

const generateMethodResolver = (method: string, operationName: string) =>
  `\t\t'${method}': ${operationName}Handler(operations.${operationName}),`
