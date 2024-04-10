import { z } from 'zod'
import { zodToJsonSchema } from '@bpinternal/zod-to-json-schema'
import { JSONSchema7 } from 'json-schema'
import { Operation, Parameter } from '../state'
import * as utils from './utils'
import _ from 'lodash'

const mapQuery = (q: Parameter<'zod-schema'>): z.ZodTypeAny => {
  if (q.in !== 'query') {
    throw new Error(`Expected query parameter, got ${q.in}`)
  }

  let schema: z.ZodTypeAny
  if (q.type === 'string') {
    schema = z.string()
  } else if (q.type === 'string[]') {
    schema = z.array(z.string())
  } else if (q.type === 'boolean') {
    schema = z.boolean()
  } else if (q.type === 'number') {
    schema = z.number()
  } else if (q.type === 'integer') {
    schema = z.number().int()
  } else {
    schema = q.schema
  }

  if (!q.required) {
    return schema.optional()
  }
  return schema
}

export const toRequestSchema = (op: Operation<string, string>): JSONSchema7 => {
  const headerParams = utils.filterObject(op.parameters ?? {}, (p) => p.in === 'header')
  const queryParams = utils.filterObject(op.parameters ?? {}, (p) => p.in === 'query')
  const pathParams = utils.filterObject(op.parameters ?? {}, (p) => p.in === 'path')

  const headerParamsSchema = z.object(_.mapValues(headerParams, () => z.string()))
  const queryParamsSchema = z.object(_.mapValues(queryParams, mapQuery))
  const pathParamsSchema = z.object(_.mapValues(pathParams, () => z.string()))

  const zodRawShape = {
    headers: headerParamsSchema,
    query: queryParamsSchema,
    params: pathParamsSchema,
    path: z.literal(op.path),
    method: z.literal(op.method),
  }

  const zodSchema =
    op.method === 'post' || op.method === 'put' || op.method === 'patch'
      ? z
          .object({
            ...zodRawShape,
            body: op.requestBody.schema,
          })
          .passthrough()
      : z.object(zodRawShape)

  return zodToJsonSchema(zodSchema) as JSONSchema7
}

export const toResponseSchema = (op: Operation<string, string>): JSONSchema7 => {
  const zodSchema = z.object({
    status: z.number().optional(),
    headers: z.record(z.string()).optional(),
    body: op.response.schema,
  })
  return zodToJsonSchema(zodSchema) as JSONSchema7
}
