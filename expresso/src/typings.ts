import { Request as ExpressRequest, Response as ExpressResponse, NextFunction as ExpressNextFunction } from 'express'
import { IncomingHttpHeaders } from 'http'
import { SchemaObject } from 'openapi3-ts'
import { z } from 'zod'
import { PathVariables } from './parse-path'

export type ZodTypeWithMeta = z.ZodType & { metaOpenApi?: SchemaObject | SchemaObject[] }
export type ZodHeaderValue = z.ZodString | z.ZodOptional<z.ZodString>
export type HeadersAnySchema = Record<string, ZodHeaderValue>
export type ParsedHeaders<H extends HeadersAnySchema> = {
  [K in keyof H]: z.infer<H[K]>
}

export type ExpressoRequest<P extends Record<string, string>, Res, Req, H extends HeadersAnySchema> = ExpressRequest<
  P,
  Res,
  Req
> & {
  headers?: IncomingHttpHeaders & ParsedHeaders<H>
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'delete'

export type EndpointProps<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends HeadersAnySchema> = {
  path: Path
  input?: I
  output?: O
  headers?: H
  operationId?: string
  deprecated?: boolean
}

export type EndpointHandler<
  Path extends string,
  I extends z.ZodType,
  O extends z.ZodType,
  H extends HeadersAnySchema
> = (
  req: ExpressoRequest<PathVariables<Path>, z.infer<O>, z.infer<I>, H>,
  res: ExpressResponse<z.infer<O>>,
  next: ExpressNextFunction
) => Promise<void>

export type Endpoint<
  Path extends string,
  I extends ZodTypeWithMeta,
  O extends ZodTypeWithMeta,
  H extends HeadersAnySchema,
  M extends HTTPMethod
> = EndpointProps<Path, I, O, H> & { method: M; handler: EndpointHandler<Path, I, O, H> }

export type AnyEndpoint = Endpoint<string, ZodTypeWithMeta, ZodTypeWithMeta, HeadersAnySchema, HTTPMethod>
