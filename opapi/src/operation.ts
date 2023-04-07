import { VError } from 'verror'
import type { Operation, OperationWithBodyProps, ParametersMap, State } from './state'
import { formatBodyName, formatResponseName, isAlphanumeric } from './util'

export const addOperation = <DefaultParameterName extends string, SectionName extends string>(
  state: State<DefaultParameterName, SectionName>,
  operationProps: Operation<DefaultParameterName, SectionName>
) => {
  const { name } = operationProps

  const parameters = createParameters(
    operationProps.parameters,
    state.defaultParameters,
    operationProps.disableDefaultParameters
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

  if (operationBodyTypeGuard(operationProps)) {
    state.refs.requestBodies[formatBodyName(name)] = true
  }

  validateParametersInPath(path, parameters)

  state.operations[name] = {
    ...operationProps,
    parameters,
    path,
  }

  state.sections.find((section) => section.name === operationProps.section)?.operations?.push(name)
}

function createParameters<DefaultParameterNames extends string>(
  parameters: ParametersMap = {},
  defaultParameters: ParametersMap = {},
  disableDefaultParameters: { [name in DefaultParameterNames]?: boolean } = {}
): ParametersMap {
  const params: ParametersMap = parameters

  Object.entries(defaultParameters).forEach(([name, parameter]) => {
    const isDefaultParameterEnabled = disableDefaultParameters[name as DefaultParameterNames] !== true

    if (isDefaultParameterEnabled) {
      params[name] = parameter
    }
  })

  return params
}

export function operationBodyTypeGuard<DefaultParameterNames extends string, Tag extends string>(
  operation: Operation<DefaultParameterNames, Tag>
): operation is OperationWithBodyProps<DefaultParameterNames, Tag> {
  return operation.method === 'put' || operation.method === 'post' || operation.method === 'patch'
}

function validateParametersInPath(path: string, parameters?: ParametersMap) {
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
