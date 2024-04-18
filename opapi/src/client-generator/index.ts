import { compile } from 'json-schema-to-typescript'
import * as utils from '../handler-generator/utils'
import fslib from 'fs'
import pathlib from 'path'
import _ from 'lodash'
import { toRequestSchema, toResponseSchema } from './map-operation'
import { JSONSchema7 } from 'json-schema'
import { State } from '../state'
import { generateErrors } from '../generators/errors'

const HEADER = `// this file was automatically generated, do not edit
// @ts-nocheck\n`

const toTs = async (schema: JSONSchema7, name: string): Promise<string> => {
  const { title, ...rest } = schema
  type jsonSchemaToTsInput = Parameters<typeof compile>[0]
  const typeCode = await compile(rest as jsonSchemaToTsInput, name, { unknownAny: false, bannerComment: '' })
  return `${typeCode}\n`
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

export const generateClientWithOpapi = async (state: State<string, string, string>, dir: string) => {
  const errorsFile = pathlib.join(dir, 'errors.ts')
  const indexFile = pathlib.join(dir, 'index.ts')
  const operationsDir = pathlib.join(dir, 'operations')
  fslib.mkdirSync(operationsDir, { recursive: true })

  const operationsByName = _.mapKeys(state.operations, (v) => v.name)

  console.log('Generating operations')
  for (const [name, op] of Object.entries(operationsByName)) {
    const { headersName, queryName, paramsName, reqBodyName, inputName, reqName, resName } = Names.of(name)
    const requestSchemas = toRequestSchema(state, op)
    const responseSchemas = toResponseSchema(state, op)

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
      requestCode += await toTs(reqBody, reqBodyName)
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

    requestCode += [
      `export const parseReq = (input: ${inputName}): ${reqName} & { path: string } => {`,
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
    fslib.writeFileSync(file, code)
  }

  console.log('generating errors file')
  const errorsFileContent = generateErrors(state.errors ?? [])
  await fslib.promises.writeFile(errorsFile, errorsFileContent)

  console.log('Generating index file')

  let indexCode = `${HEADER}\n`
  indexCode += 'import { AxiosInstance } from "axios"\n'
  for (const [name] of Object.entries(operationsByName)) {
    indexCode += `import * as ${name} from './operations/${name}'\n`
  }
  indexCode += '\n'

  indexCode += 'export class Client {\n\n'
  indexCode += 'constructor(private axiosInstance: AxiosInstance) {}\n\n'
  for (const [name, operation] of Object.entries(operationsByName)) {
    const { inputName, resName } = Names.of(name)
    indexCode += [
      `  public async ${name}(input: ${name}.${inputName}): Promise<${name}.${resName}> {`,
      `    const { path, headers, query, body } = ${name}.parseReq(input)`,
      `    return this.axiosInstance.request<${name}.${resName}>({`,
      `      method: '${operation.method}',`,
      `      url: path,`,
      `      headers,`,
      `      params: query,`,
      `      data: body,`,
      `    }).then((res) => res.data)`,
      '  }\n\n',
    ].join('\n')
  }
  indexCode += '}\n'
  fslib.writeFileSync(indexFile, indexCode)
}
