import { compile } from 'json-schema-to-typescript'
import * as utils from '../handler-generator/utils'
import fslib from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { JSONSchema7 } from 'json-schema'
import { Operation, State } from '../state'
import { toRequestShape, toResponseShape } from '../handler-generator/map-operation'
import { replaceNullableWithUnion, NullableJsonSchema } from '../jsonschema'

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

const HEADER = `// this file was automatically generated, do not edit
/* eslint-disable */
`

const GET_ERROR_FUNCTION = `// maps axios error to api error type
function getError(err: Error) {
  if (axios.isAxiosError(err) && err.response?.data) {
    return errorFrom(err.response.data)
  }
  return errorFrom(err)
}
`

const GET_AXIOS_REQ_FUNCTION = `// ensures axios request is properly formatted
type QueryValue = string | string[] | Record<string, string> | undefined
type AnyQueryParams = Record<string, QueryValue>
type HeaderValue = string | undefined
type AnyHeaderParams = Record<string, HeaderValue>
type AnyBodyParams = Record<string, any>

type ParsedRequest = {
  method: string
  path: string
  query: AnyQueryParams
  headers: AnyHeaderParams
  body: AnyBodyParams
}

export const toAxiosRequest = (req: ParsedRequest): AxiosRequestConfig => {
  const { method, path: url, query, headers: headerParams, body: data } = req

  // prepare headers
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(headerParams)) {
    if (value !== undefined) {
      headers[key] = value
    }
  }

  // prepare query params
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v))
      continue
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([k, v]) => params.append(\`\${key}[\${k}]\`, v))
      continue
    }
    if (value !== undefined) {
      params.append(key, value)
    }
  }

  return {
    method,
    url,
    headers,
    params,
    data,
  }
}
`

const toTs = async (originalSchema: JSONSchema7, name: string): Promise<string> => {
  let { title, ...schema } = originalSchema
  schema = replaceNullableWithUnion(schema as NullableJsonSchema)

  type jsonSchemaToTsInput = Parameters<typeof compile>[0]
  const typeCode = await compile(schema as jsonSchemaToTsInput, name, { unknownAny: false, bannerComment: '' })

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
    requestCode += await toTs(headers, headersName)
    requestCode += await toTs(query, queryName)
    requestCode += await toTs(params, paramsName)
    if (reqBody) {
      const tsCode = await toTs(reqBody, reqBodyName)
      requestCode += tsCode
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
    responseCode += await toTs(resBody, resName)

    const code = `${HEADER}\n${requestCode}\n${responseCode}`
    const file = pathlib.join(operationsDir, `${name}.ts`)
    await writeTs(file, code)
  }
}

export const generateIndex = async (state: State<string, string, string>, indexFile: string) => {
  const operationsByName = _.mapKeys(state.operations, (v) => v.name)

  let indexCode = `${HEADER}\n`
  indexCode += "import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'\n"
  indexCode += "import { errorFrom } from './errors'\n\n"

  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `import * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += "export * from './models'\n\n"
  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `export * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += 'export class Client {\n\n'
  indexCode += 'constructor(private axiosInstance: AxiosInstance) {}\n\n'
  for (const [name, operation] of Object.entries(operationsByName)) {
    const { inputName, resName } = Names.of(name)
    indexCode += [
      `  public readonly ${name} = async (input: ${name}.${inputName}): Promise<${name}.${resName}> => {`,
      `    const { path, headers, query, body } = ${name}.parseReq(input)`,
      `    const axiosReq = toAxiosRequest({`,
      `        method: "${operation.method}",`,
      '        path,',
      '        headers: { ...headers },',
      '        query: { ...query },',
      '        body,',
      '    })',
      `    return this.axiosInstance.request<${name}.${resName}>(axiosReq)`,
      `      .then((res) => res.data)`,
      `      .catch((e) => { throw getError(e) })`,
      '  }\n\n',
    ].join('\n')
  }
  indexCode += '}\n\n'

  indexCode += `${GET_ERROR_FUNCTION}\n`
  indexCode += `${GET_AXIOS_REQ_FUNCTION}\n`

  await writeTs(indexFile, indexCode)
}
