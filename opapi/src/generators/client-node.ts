import { compile } from 'json-schema-to-typescript'
import * as utils from '../handler-generator/utils'
import fslib from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { JSONSchema7 } from 'json-schema'
import { Operation, State } from '../state'
import { toRequestShape, toResponseShape } from '../handler-generator/map-operation'
import { replaceNullableWithUnion, NullableJsonSchema, setDefaultAdditionalProperties } from '../jsonschema'

type ObjectBuilder = utils.JsonSchemaBuilder['object']
const objectBuilder: ObjectBuilder = (...args) => ({
  ...utils.jsonSchemaBuilder.object(...args),
  additionalProperties: false,
})
const s = { ...utils.jsonSchemaBuilder, object: objectBuilder }

const mapRequest = (state: State<string, string, string>, op: Operation<string, string, string, 'json-schema'>) =>
  toRequestShape(state, op, s)

const mapResponse = (state: State<string, string, string>, op: Operation<string, string, string, 'json-schema'>) =>
  toResponseShape(state, op, s)

const fixSchema = (schema: JSONSchema7): JSONSchema7 => {
  schema = replaceNullableWithUnion(schema as NullableJsonSchema)
  schema = setDefaultAdditionalProperties(schema, false)
  return schema
}

// useful for debugging, remove when generator is stable
const debugSchema =
  (inputSchema: JSONSchema7, key: string, enable: boolean = false) =>
  (tsCode: string) => {
    if (!enable) {
      return tsCode
    }
    console.info(`### ${key}`)
    console.info('### schema', JSON.stringify(inputSchema, null, 2))
    console.info('### fixed', JSON.stringify(fixSchema(inputSchema), null, 2))
    console.info('### tsCode', tsCode)
    return tsCode
  }

const HEADER = `// this file was automatically generated, do not edit
/* eslint-disable */
`

const GET_ERROR_FUNCTION = `// maps http error to api error type
function toApiError(err: unknown): Error {
  const data = (err as { response?: { data?: unknown } } | null)?.response?.data
  if (data) {
    return errorFrom(data)
  }
  return errorFrom(err)
}
`

/**
 * The function:
 * (query: any) => qs.stringify(query, { encode: true, arrayFormat: 'repeat', allowDots: true })
 *
 * Yields the following results:
 * { dev: false }                        ->  ?dev=false
 * { tags: { foo: 'bar', baz: 'qux' } }  ->  ?tags.foo=bar&tags.baz=qux
 * { participantIds: ['foo', 'bar'] }    ->  ?participantIds=foo&participantIds=bar
 * { limit: 10 }                         ->  ?limit=10
 */

const GET_REQUEST_FUNCTION = `
import qs from "qs"

export type Primitive = string | number | boolean
export type Value<P extends Primitive> = P | P[] | Record<string, P>
export type QueryValue = Value<string> | Value<boolean> | Value<number> | undefined
export type AnyQueryParams = Record<string, QueryValue>
export type HeaderValue = string | undefined
export type AnyHeaderParams = Record<string, HeaderValue>
export type AnyBodyParams = Record<string, any>
export type ParsedRequest = {
  method: string
  path: string
  query: AnyQueryParams
  headers: AnyHeaderParams
  body: AnyBodyParams
}

export type RequestConfig = {
  method: string
  url: string
  headers: Record<string, string>
  data?: any
}

const isDefined = <T>(pair: [string, T | undefined]): pair is [string, T] => pair[1] !== undefined

export const toRequest = (req: ParsedRequest): RequestConfig => {
  const { method, path, query, headers: headerParams, body } = req

  // prepare headers
  const headerEntries: [string, string][] = Object.entries(headerParams).filter(isDefined)
  const headers = Object.fromEntries(headerEntries)

  // prepare query params
  const queryString = qs.stringify(query, { encode: true, arrayFormat: 'repeat', allowDots: true })

  const url = queryString ? [path, queryString].join('?') : path
  const data =
    ['put', 'post', 'delete', 'patch'].includes(method.toLowerCase())
      ? body
      : undefined

  return {
    method,
    url,
    headers,
    data,
  }
}
`

const toTs = async (originalSchema: JSONSchema7, name: string): Promise<string> => {
  let { title, ...schema } = originalSchema
  schema = fixSchema(schema)

  type jsonSchemaToTsInput = Parameters<typeof compile>[0]
  const typeCode = await compile(schema as jsonSchemaToTsInput, name, {
    unknownAny: false,
    bannerComment: '',
    additionalProperties: false,
    ignoreMinAndMaxItems: true,
  })

  return `${typeCode}\n`
}

const writeTs = async (file: string, tsCode: string) => {
  // TODO: format code here
  await fslib.promises.writeFile(file, tsCode)
}

class Names {
  public readonly name: string
  public readonly pascalCase: string
  public readonly headersName: string
  public readonly queryName: string
  public readonly paramsName: string
  public readonly reqBodyName: string
  public readonly inputName: string
  public readonly reqName: string
  public readonly resName: string

  public static of(name: string): Names {
    return new Names(name)
  }

  private constructor(name: string) {
    this.name = name
    this.pascalCase = utils.pascalCase(name)
    this.headersName = `${this.pascalCase}RequestHeaders`
    this.queryName = `${this.pascalCase}RequestQuery`
    this.paramsName = `${this.pascalCase}RequestParams`
    this.reqBodyName = `${this.pascalCase}RequestBody`
    this.inputName = `${this.pascalCase}Input`
    this.reqName = `${this.pascalCase}Request`
    this.resName = `${this.pascalCase}Response`
  }
}

export const generateModels = async (state: State<string, string, string>, modelsFile: string) => {
  const modelSchemas = _.mapValues(state.schemas, (s) => s.schema as JSONSchema7)
  let modelCode: string = `${HEADER}\n`
  for (const [name, schema] of Object.entries(modelSchemas)) {
    modelCode += await toTs(schema, name)
  }
  await writeTs(modelsFile, modelCode)
}

export const generateOperations = async (state: State<string, string, string>, operationsDir: string) => {
  const operationsByName = _.mapKeys(state.operations, (v) => v.name)

  for (const [name, op] of Object.entries(operationsByName)) {
    const { headersName, queryName, paramsName, reqBodyName, inputName, reqName, resName } = Names.of(name)
    const requestSchemas = mapRequest(state, op)
    const responseSchemas = mapResponse(state, op)

    const { headers, query, params, body: reqBody } = requestSchemas
    const { body: resBody } = responseSchemas

    const headerKeys = Object.keys(headers.properties ?? {})
    const queryKeys = Object.keys(query.properties ?? {})
    const paramsKeys = Object.keys(params.properties ?? {})
    const reqBodyKeys = Object.keys(reqBody?.properties ?? {})

    let requestCode = ''
    requestCode += await toTs(headers, headersName).then(debugSchema(headers, 'headers'))
    requestCode += await toTs(query, queryName).then(debugSchema(query, 'query'))
    requestCode += await toTs(params, paramsName).then(debugSchema(params, 'params'))
    if (reqBody) {
      requestCode += await toTs(reqBody, reqBodyName).then(debugSchema(reqBody, 'reqBody'))
    } else {
      requestCode += `export interface ${reqBodyName} {}\n\n`
    }
    requestCode += `export type ${inputName} = ${reqBodyName} & ${headersName} & ${queryName} & ${paramsName}\n\n`
    requestCode += [
      `export type ${reqName} = {`,
      `  headers: ${headersName};`,
      `  query: ${queryName};`,
      `  params: ${paramsName};`,
      `  body: ${reqBodyName};`,
      `}\n\n`,
    ].join('\n')

    const getKey = (variable: string, key: string) => `${variable}['${key}']`
    const toObject = (keys: string[]) => '{ ' + keys.map((k) => `'${k}': ${getKey('input', k)}`).join(', ') + ' }'
    const path = op.path.replace(/{([^}]+)}/g, (_, p) => `\${encodeURIComponent(${getKey('input', p)})}`)

    const allParams = [...headerKeys, ...queryKeys, ...paramsKeys, ...reqBodyKeys]

    const functionDeclaration =
      allParams.length === 0
        ? `export const parseReq = (_: ${inputName}): ${reqName} & { path: string } => {` // no input parameter
        : `export const parseReq = (input: ${inputName}): ${reqName} & { path: string } => {`

    requestCode += [
      functionDeclaration,
      `  return {`,
      `    path: \`${path}\`,`,
      `    headers: ${toObject(headerKeys)},`,
      `    query: ${toObject(queryKeys)},`,
      `    params: ${toObject(paramsKeys)},`,
      `    body: ${toObject(reqBodyKeys)},`,
      `  }`,
      `}\n`,
    ].join('\n')

    let responseCode = ''
    responseCode += await toTs(resBody, resName).then(debugSchema(resBody, 'resBody'))

    const code = `${HEADER}\n${requestCode}\n${responseCode}`
    const file = pathlib.join(operationsDir, `${name}.ts`)
    await writeTs(file, code)
  }
}

export const generateToRequest = async (toRequestFile: string) => {
  await writeTs(toRequestFile, GET_REQUEST_FUNCTION)
}

export const generateIndex = async (state: State<string, string, string>, indexFile: string) => {
  const operationsByName = _.mapKeys(state.operations, (v) => v.name)

  let indexCode = [
    `${HEADER}`,
    "import { errorFrom } from './errors'",
    "import { toRequest, type RequestConfig } from './to-request'",
    '',
  ].join('\n')

  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `import * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += "export * from './models'\n\n"
  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `export * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += `export const apiVersion = '${state.metadata.version}'\n\n`

  indexCode += [
    'export type HttpResponse<T> = {',
    '  data: T',
    '}',
    '',
    '/**',
    ' * Minimal http transport the generated client depends on. Implementations',
    ' * MUST reject (throw) on unsuccessful http statuses — exposing the parsed',
    ' * error body under `response.data` on the thrown error so it can be mapped',
    ' * to an api error — and resolve with the parsed response body under `data`.',
    ' */',
    'export type HttpClient = {',
    '  request: <T>(config: RequestConfig) => Promise<HttpResponse<T>>',
    '}',
  ].join('\n')
  indexCode += '\n\n'

  indexCode += [
    'export type ClientProps = {',
    '  toRequest: typeof toRequest', // allows to override the toRequest function
    '  toApiError: typeof toApiError', // allows to override the toApiError function
    '}',
  ].join('\n')
  indexCode += '\n\n'

  indexCode += 'export class Client {\n\n'
  indexCode += '  public constructor(private httpClient: HttpClient, private props: Partial<ClientProps> = {}) {}\n\n'
  for (const [name, operation] of Object.entries(operationsByName)) {
    const { inputName, resName } = Names.of(name)
    indexCode += [
      `  public readonly ${name} = async (input: ${name}.${inputName}): Promise<${name}.${resName}> => {`,
      `    const { path, headers, query, body } = ${name}.parseReq(input)`,
      '',
      `    const mapRequest = this.props.toRequest ?? toRequest`,
      `    const mapErrorResponse = this.props.toApiError ?? toApiError`,
      '',
      `    const httpReq = mapRequest({`,
      `        method: "${operation.method}",`,
      '        path,',
      '        headers: { ...headers },',
      '        query: { ...query },',
      '        body,',
      '    })',
      `    return this.httpClient.request<${name}.${resName}>(httpReq)`,
      `      .then((res) => res.data)`,
      `      .catch((e) => { throw mapErrorResponse(e) })`,
      '  }\n\n',
    ].join('\n')
  }
  indexCode += '}\n\n'

  indexCode += `${GET_ERROR_FUNCTION}\n`

  await writeTs(indexFile, indexCode)
}
