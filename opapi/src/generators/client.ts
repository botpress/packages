import { title, sift, camel } from 'radash'
import type { Parameter as OpenApiParameter } from '../state'
import type { GenerateHandlersProps, GenerateHandlerProps } from './handlers'
import { typeHelpers } from './helpers'

type Parameters = {
  name: string
  parameter: OpenApiParameter<'json-schema'>
}[]

type GenerateClientsProps = Omit<GenerateHandlersProps, 'useExpressTypes'>

type GenerateClientProps = GenerateHandlerProps & {
  hasParameters: boolean
  parameters: Parameters
}

export function generateClientCode(props: GenerateClientsProps) {
  const operations: GenerateClientProps[] = props.operations.map((operation) => ({
    ...operation,
    hasParameters: operationHasParameters(operation),
    parameters: getParameters(operation),
  }))

  return `
import axios, { AxiosInstance } from 'axios'
import {
  DefaultApi,
  Configuration,
${sift(operations.map((operation) => generateImport(operation))).join(',\n')},
} from '.'
import { errorFrom } from './errors'

${typeHelpers}

export class ApiClient {
  private _innerClient: DefaultApi
  public constructor(configuration?: Configuration, basePath?: string, axiosInstance?: AxiosInstance) {
    this._innerClient = new DefaultApi(configuration, basePath, axiosInstance)
  }
${operations.map((operation) => generateMethod(operation)).join('\n')}
}

${operations.map((operation) => generatePropsType(operation)).join('\n')}

function getError(err: Error) {
  if (axios.isAxiosError(err) && err.response?.data) {
    return errorFrom(err.response.data)
  }
  return errorFrom(err)
}
`
}

function generateMethod(props: GenerateClientProps) {
  const { operationName } = props
  return `\tpublic ${operationName} = (${generateMethodProps(
    props,
  )}) => this._innerClient.${operationName}(${generateClientProps(
    props,
  )}).then((res) => res.data).catch((e) => { throw getError(e) })`
}

function generatePropsType({ operationName, body, hasParameters, isEmptyBody }: GenerateClientProps) {
  if (!body) {
    if (!hasParameters) {
      return ''
    }

    return `export type ${generatePropsName(operationName)} = Merge<${generateRequestPropsName(operationName)}, {}>\n`
  }

  return `export type ${generatePropsName(operationName)} = Merge<
  Except<${generateRequestPropsName(operationName)}, '${generateBodyTypeName(operationName, isEmptyBody)}'>,
  NonNullable<${generateRequestPropsName(operationName)}['${generateBodyTypeName(operationName, isEmptyBody)}']>
>\n`
}

function generateClientProps({ operationName, body, hasParameters, parameters, isEmptyBody }: GenerateClientProps) {
  if (!body) {
    if (!hasParameters) {
      return ''
    }

    return 'props'
  }

  return `{ ${generateParamProps(parameters)}${generateBodyTypeName(operationName, isEmptyBody)} }`
}

function generateMethodProps({ operationName, body, parameters, hasParameters, isEmptyBody }: GenerateClientProps) {
  if (!body) {
    if (!hasParameters) {
      return ''
    }

    return `props: ${generatePropsName(operationName)}`
  }

  if (!hasParameters) {
    return `${generateBodyTypeName(operationName, isEmptyBody)}: ${generatePropsName(operationName)}`
  }

  return `{ ${generateParamProps(parameters)}...${generateBodyTypeName(
    operationName,
    isEmptyBody,
  )} }: ${generatePropsName(operationName)}`
}

function generateParamProps(parameters: Parameters) {
  if (!parameters.length) {
    return ''
  }

  return parameters.map((parameter) => camel(parameter.name)).join(', ') + ', '
}

function generatePropsName(operationName: string) {
  return `${title(operationName).split(' ').join('')}Props`
}

function generateRequestPropsName(operationName: string) {
  return `DefaultApi${title(operationName).split(' ').join('')}Request`
}

function generateBodyTypeName(operationName: string, isEmptyBody: boolean) {
  return isEmptyBody ? 'body' : `${operationName}Body`
}

function generateImport({ body, hasParameters, operationName }: GenerateClientProps) {
  return !body && !hasParameters ? undefined : `\t${generateRequestPropsName(operationName)}`
}

function operationHasParameters({ params, headers, queries, cookies }: GenerateHandlerProps) {
  return params.length + headers.length + queries.length + cookies.length > 0
}

function getParameters({ params, headers, queries, cookies }: GenerateHandlerProps) {
  return [...params, ...headers, ...queries, ...cookies]
}
