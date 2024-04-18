import { compile } from 'json-schema-to-typescript'
import * as utils from '../handler-generator/utils'
import fslib from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { JSONSchema7 } from 'json-schema'
import { Operation, State } from '../state'
import { toRequestShape, toResponseShape } from '../handler-generator/map-operation'

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

// replace all occurences of { type: T, nullable: true } with { anyOf: [{ type: T }, { type: 'null' }] }
const fixJsonSchema = (schema: JSONSchema7): JSONSchema7 => {
  if ((schema as any).nullable) {
    return { anyOf: [{ type: schema.type }, { type: 'null' }] }
  }
  if (schema.type === 'object') {
    const properties = schema.properties ? _.mapValues(schema.properties, fixJsonSchema) : schema.properties
    const additionalProperties =
      typeof schema.additionalProperties === 'object'
        ? fixJsonSchema(schema.additionalProperties)
        : schema.additionalProperties
    return { ...schema, properties, additionalProperties }
  }
  return schema
}

const toTs = async (originalSchema: JSONSchema7, name: string): Promise<string> => {
  let { title, ...schema } = originalSchema
  schema = fixJsonSchema(schema)

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

    const toObject = (keys: string[]) => '{ ' + keys.map((k) => `${k}: input.${k}`).join(', ') + ' }'
    const path = op.path.replace(/{([^}]+)}/g, (_, p) => `\${input.${p}}`)

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
  indexCode += "import axios, { AxiosInstance } from 'axios'\n"
  indexCode += "import { errorFrom } from './errors'\n\n"

  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `import * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += "export * from './models'\n"

  indexCode += 'export class Client {\n\n'
  indexCode += 'constructor(private axiosInstance: AxiosInstance) {}\n\n'
  for (const [name, operation] of Object.entries(operationsByName)) {
    const { inputName, resName } = Names.of(name)
    indexCode += [
      `  public readonly ${name} = async (input: ${name}.${inputName}): Promise<${name}.${resName}> => {`,
      `    const { path, headers, query, body } = ${name}.parseReq(input)`,
      `    return this.axiosInstance.request<${name}.${resName}>({`,
      `      method: '${operation.method}',`,
      `      url: path,`,
      `      headers,`,
      `      params: query,`,
      `      data: body,`,
      `    })`,
      `      .then((res) => res.data)`,
      `      .catch((e) => { throw getError(e) })`,
      '  }\n\n',
    ].join('\n')
  }
  indexCode += '}\n'

  indexCode += [
    'function getError(err: Error) {',
    '  if (axios.isAxiosError(err) && err.response?.data) {',
    '    return errorFrom(err.response.data)',
    '  }',
    '  return errorFrom(err)',
    '}\n',
  ].join('\n')

  await writeTs(indexFile, indexCode)
}
