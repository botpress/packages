import { JSONSchema7 } from 'json-schema'
import { Operation, Parameter, State } from '../state'
import * as utils from './utils'
import _ from 'lodash'
import { partiallyUnref } from './unref'

const s = utils.jsonSchemaBuilder

const mapQuery = (q: Parameter<'json-schema'>): JSONSchema7 => {
  if (q.in !== 'query') {
    throw new Error(`Expected query parameter, got ${q.in}`)
  }

  let schema: JSONSchema7
  if (q.type === 'string') {
    schema = s.string()
  } else if (q.type === 'string[]') {
    schema = s.array(s.string())
  } else if (q.type === 'boolean') {
    schema = s.boolean()
  } else if (q.type === 'number') {
    schema = s.number()
  } else if (q.type === 'integer') {
    schema = s.integer()
  } else {
    schema = q.schema as JSONSchema7
  }

  return schema
}

type PathParam = Extract<Parameter<'json-schema'>, { in: 'path' }>
type OptionalParam = Exclude<Parameter<'json-schema'>, { in: 'path' }>

export const toRequestSchema = (
  _state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
): JSONSchema7 => {
  const headerParams = utils.filterObject(op.parameters ?? {}, (p): p is OptionalParam => p.in === 'header')
  const queryParams = utils.filterObject(op.parameters ?? {}, (p): p is OptionalParam => p.in === 'query')
  const pathParams = utils.filterObject(op.parameters ?? {}, (p): p is PathParam => p.in === 'path')

  const requiredHeaderParams: string[] = Object.entries(headerParams)
    .filter(([_, h]) => h.required)
    .map(([k]) => k)
  const headerParamsSchema = s.object(
    _.mapValues(headerParams, () => s.string()),
    requiredHeaderParams,
  )

  const requiredQueryParams: string[] = Object.entries(queryParams)
    .filter(([_, q]) => q.required)
    .map(([k]) => k)
  const queryParamsSchema = s.object(
    _.mapValues(queryParams, (q) => mapQuery(q)),
    requiredQueryParams,
  )

  const requiredPathParams: string[] = Object.keys(pathParams)
  const pathParamsSchema = s.object(
    _.mapValues(pathParams, () => s.string()),
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
    return s.object({
      ...rawShape,
      body: { ...bodySchema, additionalProperties: true }, // passthrough
    })
  }

  return s.object(rawShape)
}

const unrefResponseSchema = (state: State<string, string, string>, responseSchema: JSONSchema7): JSONSchema7 => {
  const models = _(state.schemas)
    .mapKeys((_schema, name) => `#/components/schemas/${name}`)
    .mapValues((s) => s.schema as JSONSchema7)
    .value()

  return partiallyUnref(responseSchema, models)
}

export const toResponseSchema = (
  state: State<string, string, string>,
  op: Operation<string, string, string, 'json-schema'>,
): JSONSchema7 => {
  const responseSchema = unrefResponseSchema(state, op.response.schema as JSONSchema7)
  return s.object(
    {
      status: s.number(),
      headers: s.record(s.string()),
      body: responseSchema,
    },
    ['body'],
  )
}