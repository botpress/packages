import { JSONSchema7 } from 'json-schema'
import { Operation, Parameter, State } from '../state'
import * as utils from './utils'
import _ from 'lodash'
import { partiallyUnref } from './unref'

// ### request ###

type PathParam = Extract<Parameter<'json-schema'>, { in: 'path' }>
type OptionalParam = Exclude<Parameter<'json-schema'>, { in: 'path' }>

const _mapPathParam = (p: PathParam, s: utils.JsonSchemaBuilder): JSONSchema7 => {
  if (p.enum) {
    return s.enum(...p.enum)
  }
  return s.string()
}

const _mapOptionalParameter = (p: OptionalParam, s: utils.JsonSchemaBuilder): JSONSchema7 => {
  let schema: JSONSchema7
  if (p.type === 'string' && p.enum) {
    schema = s.enum(...p.enum)
  } else if (p.type === 'string') {
    schema = s.string()
  } else if (p.type === 'string[]' && p.enum) {
    schema = s.array(s.enum(...p.enum))
  } else if (p.type === 'string[]') {
    schema = s.array(s.string())
  } else if (p.type === 'boolean') {
    schema = s.boolean()
  } else if (p.type === 'number') {
    schema = s.number()
  } else if (p.type === 'integer') {
    schema = s.integer()
  } else {
    schema = p.schema as JSONSchema7
  }

  return schema
}

type RequestProp = 'headers' | 'query' | 'params' | 'path' | 'method'
type RequestOptionalProps = 'body'
export type RequestShape = Record<RequestProp, JSONSchema7> & Record<RequestOptionalProps, JSONSchema7 | undefined>

export const toRequestShape = (
  _state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
  s: utils.JsonSchemaBuilder = utils.jsonSchemaBuilder,
): RequestShape => {
  const headerParams = utils.filterObject(op.parameters ?? {}, (p): p is OptionalParam => p.in === 'header')
  const queryParams = utils.filterObject(op.parameters ?? {}, (p): p is OptionalParam => p.in === 'query')
  const pathParams = utils.filterObject(op.parameters ?? {}, (p): p is PathParam => p.in === 'path')

  const requiredHeaderParams: string[] = Object.entries(headerParams)
    .filter(([_, h]) => h.required)
    .map(([k]) => k)
  const headerParamsSchema = s.object(
    _.mapValues(headerParams, (h) => _mapOptionalParameter(h, s)),
    requiredHeaderParams,
  )

  const requiredQueryParams: string[] = Object.entries(queryParams)
    .filter(([_, q]) => q.required)
    .map(([k]) => k)
  const queryParamsSchema = s.object(
    _.mapValues(queryParams, (q) => _mapOptionalParameter(q, s)),
    requiredQueryParams,
  )

  const requiredPathParams: string[] = Object.keys(pathParams)
  const pathParamsSchema = s.object(
    _.mapValues(pathParams, (p) => _mapPathParam(p, s)),
    requiredPathParams,
  )

  const rawShape = {
    headers: headerParamsSchema,
    query: queryParamsSchema,
    params: pathParamsSchema,
    path: s.literal(op.path),
    method: s.literal(op.method),
  }

  if (op.method === 'post' || op.method === 'put' || op.method === 'patch') {
    const bodySchema = op.requestBody.schema as JSONSchema7
    return {
      ...rawShape,
      body: bodySchema,
    }
  }
  return { ...rawShape, body: undefined }
}

export const toRequestSchema = (
  state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
  s: utils.JsonSchemaBuilder = utils.jsonSchemaBuilder,
): JSONSchema7 => {
  const { body, ...shape } = toRequestShape(state, op, s)
  if (body) {
    return s.object({
      ...shape,
      body: {
        ...body,
        additionalProperties: true, // passthrough
      },
    })
  }
  return s.object(shape)
}

// ### response ###

type ResponseProp = 'status' | 'headers' | 'body'
export type ResponseShape = Record<ResponseProp, JSONSchema7>

const _unrefResponseSchema = (state: State<string, string, string>, responseSchema: JSONSchema7): JSONSchema7 => {
  const models = _(state.schemas)
    .mapKeys((_schema, name) => `#/components/schemas/${name}`)
    .mapValues((s) => s.schema as JSONSchema7)
    .value()
  return partiallyUnref(responseSchema, models)
}

export const toResponseShape = (
  state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
  s: utils.JsonSchemaBuilder = utils.jsonSchemaBuilder,
): ResponseShape => {
  const responseSchema = _unrefResponseSchema(state, op.response.schema as JSONSchema7)
  return {
    status: s.number(),
    headers: s.record(s.string()),
    body: responseSchema,
  }
}

export const toResponseSchema = (
  state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
  s: utils.JsonSchemaBuilder = utils.jsonSchemaBuilder,
): JSONSchema7 => {
  const rawShape = toResponseShape(state, op, s)
  return s.object(rawShape, ['body'])
}
