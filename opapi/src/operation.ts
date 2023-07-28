import { VError } from 'verror'
import {
  Operation,
  OperationWithBodyProps,
  OperationWithoutBodyMethod,
  ParametersMap,
  State,
  mapParameter,
} from './state'
import { formatBodyName, formatResponseName, isAlphanumeric } from './util'
import { generateSchemaFromZod } from './jsonschema'
import { extendApi } from '@anatine/zod-openapi'
import { objects } from './objects'

export const addOperation = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
  operationProps: Operation<DefaultParameterName, SectionName, string, 'zod-schema'>,
) => {
  const { name } = operationProps
  const responseName = formatResponseName(name)
  const bodyName = formatBodyName(name)

  const parameters = createParameters(
    operationProps.parameters ? objects.mapValues(operationProps.parameters, mapParameter) : undefined,
    state.defaultParameters,
    operationProps.disableDefaultParameters,
  )

  if (operationProps.path[0] !== '/') {
    throw new VError(`Invalid path ${operationProps.path}. It must start with a /`)
  }

  const path = state.metadata.prefix ? `/${state.metadata.prefix}${operationProps.path}` : operationProps.path

  if (!isAlphanumeric(name)) {
    throw new VError(`Invalid operation name ${name}. It must be alphanumeric and start with a letter`)
  }

  if (state.operations[name]) {
    throw new VError(`Operation ${name} already exists`)
  }

  state.refs.responses[formatResponseName(name)] = true

  const response = {
    description: operationProps.response.description,
    status: operationProps.response.status,
    schema: generateSchemaFromZod(extendApi(operationProps.response.schema, { title: responseName })),
  }

  let operation: Operation<DefaultParameterName, SectionName, string, 'json-schema'>
  if (operationBodyTypeGuard(operationProps)) {
    state.refs.requestBodies[formatBodyName(name)] = true
    operation = {
      ...operationProps,
      parameters,
      path,
      response,
      requestBody: {
        description: operationProps.requestBody.description,
        schema: generateSchemaFromZod(extendApi(operationProps.requestBody.schema, { title: bodyName })),
      },
    }
  } else {
    operation = {
      ...operationProps,
      method: operationProps.method as OperationWithoutBodyMethod,
      parameters,
      path,
      response,
    }
  }

  validateParametersInPath(path, parameters)

  state.operations[name] = operation

  state.sections.find((section) => section.name === operationProps.section)?.operations?.push(name)
}

function createParameters<DefaultParameterNames extends string>(
  parameters: ParametersMap<string, 'json-schema'> = {},
  defaultParameters: ParametersMap<string, 'json-schema'> = {},
  disableDefaultParameters: { [name in DefaultParameterNames]?: boolean } = {},
): ParametersMap<string, 'json-schema'> {
  const params: ParametersMap<string, 'json-schema'> = parameters

  Object.entries(defaultParameters).forEach(([name, parameter]) => {
    const isDefaultParameterEnabled = disableDefaultParameters[name as DefaultParameterNames] !== true

    if (isDefaultParameterEnabled) {
      params[name] = parameter
    }
  })

  return params
}

export function operationBodyTypeGuard<DefaultParameterNames extends string, Tag extends string>(
  operation: Operation<DefaultParameterNames, Tag, string, 'json-schema' | 'zod-schema'>,
): operation is OperationWithBodyProps<DefaultParameterNames, Tag, string, 'json-schema'> {
  return operation.method === 'put' || operation.method === 'post' || operation.method === 'patch'
}

function validateParametersInPath(path: string, parameters?: ParametersMap<string, 'json-schema'>) {
  const parametersMapInPath = getParameterFromPath(path).reduce((value, current) => {
    value[current] = false
    return value
  }, {} as { [name: string]: boolean })

  if (parameters) {
    Object.entries(parameters).map(([parameterName, parameter]) => {
      if (parameter.in === 'path') {
        if (parametersMapInPath[parameterName] === undefined) {
          throw new VError(`Parameter ${parameterName} is not in path ${path}`)
        }

        parametersMapInPath[parameterName] = true
      }
    })
  }

  Object.entries(parametersMapInPath).forEach(([parameterName, isPresent]) => {
    if (!isPresent) {
      throw new VError(`Parameter ${parameterName} is not present in path ${path}`)
    }
  })
}

function getParameterFromPath(path: string): string[] {
  const parameters: string[] = []

  const regex = /{([^}]+)}/g
  let match

  while ((match = regex.exec(path)) !== null) {
    if (match[1]) {
      parameters.push(match[1])
    } else {
      throw new VError(`Invalid path parameter ${path}`)
    }
  }

  return parameters
}
