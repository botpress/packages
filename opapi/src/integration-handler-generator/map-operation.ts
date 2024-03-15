import { z } from 'zod'
import { Operation, Parameter } from '../opapi'
import * as utils from './utils'

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
  } else {
    schema = q.schema
  }

  if (!q.required) {
    return schema.optional()
  }
  return schema
}

export const toRequestSchema = (op: Operation<string, string>): z.AnyZodObject => {
  const headerParams = utils.filter(op.parameters ?? {}, (p) => p.in === 'header')
  const queryParams = utils.filter(op.parameters ?? {}, (p) => p.in === 'query')
  const pathParams = utils.filter(op.parameters ?? {}, (p) => p.in === 'path')

  const headerParamsSchema = z.object(utils.mapValues(headerParams, () => z.string()))
  const queryParamsSchema = z.object(utils.mapValues(queryParams, mapQuery))
  const pathParamsSchema = z.object(utils.mapValues(pathParams, () => z.string()))

  const zodRawShape = {
    headers: headerParamsSchema,
    query: queryParamsSchema,
    params: pathParamsSchema,
    path: z.literal(op.path),
    method: z.literal(op.method),
  }

  return op.method === 'post' || op.method === 'put' || op.method === 'patch'
    ? z
        .object({
          ...zodRawShape,
          body: op.requestBody.schema,
        })
        .passthrough()
    : z.object(zodRawShape)
}

export const toResponseSchema = (op: Operation<string, string>): z.AnyZodObject => {
  return z.object({
    status: z.number().optional(),
    headers: z.record(z.string()).optional(),
    body: op.response.schema,
  })
}
