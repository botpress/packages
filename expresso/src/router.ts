import bodyparser from 'body-parser'
import express from 'express'
import httpErrors from 'http-errors'
import _ from 'lodash'
import { InfoObject } from 'openapi3-ts'
import { z } from 'zod'
import { generateCliDocumentation } from './cli-doc'
import * as errors from './errors'
import { guards, Middleware } from './middlewares'
import { generateOpenAPI } from './openapi'
import { EndpointProps, EndpointHandler, AnyEndpoint, Endpoint, HTTPMethod } from './typings'

export type JsonRouterProps = {
  info: Partial<InfoObject>
  bodySize: string | number
}

const DEFAULT_INFO: InfoObject = { title: 'XoApp', version: '1.0.0' }
const DEFAULT_PROPS: JsonRouterProps = { info: DEFAULT_INFO, bodySize: '1mb' }

export class JsonRouter {
  private _mws: Middleware[] = []
  private _router: express.IRouter
  private _props: JsonRouterProps

  private get endpoints() {
    return this._mws.filter(guards.endpoint).map(({ endpoint }) => endpoint)
  }

  public static unshift(router: JsonRouter, basePath: string): JsonRouter {
    return new JsonRouter(router._props).extend(router).unshift(basePath)
  }

  public static merge(router1: JsonRouter, router2: JsonRouter): JsonRouter {
    return new JsonRouter().extend(router1).extend(router2)
  }

  constructor(props: Partial<JsonRouterProps> = {}) {
    this._props = { ...DEFAULT_PROPS, ...props }
    this._router = this._initRouter(this._props)
  }

  public get inner(): express.IRouter {
    return this._router
  }

  public get openapi() {
    const resolved = { ...DEFAULT_INFO, ...this._props.info }
    return generateOpenAPI(this.endpoints, resolved)
  }

  public get cliDoc() {
    return generateCliDocumentation(this.endpoints)
  }

  public unshift(basePath: string): this {
    this._router = this._initRouter(this._props)

    const mws = [...this._mws].map((mw) => {
      if (guards.error(mw)) {
        return mw
      }

      const { path: oldPath, ...e } = mw.endpoint
      const sep = oldPath.startsWith('/') ? '' : '/'
      const path = `${basePath}${sep}${oldPath}`
      return { ...mw, endpoint: { ...e, path } }
    })
    this._mws = []

    for (const mw of mws) {
      this._add(mw)
    }
    return this
  }

  public extend(router: JsonRouter): this {
    this._router = this._initRouter(this._props)
    for (const mw of router._mws) {
      this._add(mw)
    }
    return this
  }

  public get<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    handler: EndpointHandler<Path, I, O, H>,
  ) {
    return this._router.get(info.path, this._makeHandler({ ...info, method: 'get', handler }))
  }

  public put<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    handler: EndpointHandler<Path, I, O, H>,
  ) {
    return this._router.put(info.path, this._makeHandler({ ...info, method: 'put', handler }))
  }

  public post<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    handler: EndpointHandler<Path, I, O, H>,
  ) {
    return this._router.post(info.path, this._makeHandler({ ...info, method: 'post', handler }))
  }

  public delete<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    handler: EndpointHandler<Path, I, O, H>,
  ) {
    return this._router.delete(info.path, this._makeHandler({ ...info, method: 'delete', handler }))
  }

  public error(handler: express.ErrorRequestHandler) {
    this._mws.push({ type: 'error', handler })
    this._router.use(handler)
  }

  private _initRouter = (props: JsonRouterProps) => {
    const router = express.Router({ mergeParams: false })
    router.use(bodyparser.json({ limit: props.bodySize }))
    router.use((thrown, _req, _res, next) => {
      if (httpErrors.isHttpError(thrown)) {
        return next(new errors.HTTPError(thrown))
      }
      return next(thrown)
    })
    return router
  }

  private _add = (mw: Middleware) => {
    if (guards.error(mw)) {
      this.error(mw.handler)
      return
    }

    const { endpoint: e } = mw
    if (e.method === 'get') {
      this.get(e as any, e.handler)
    } else if (e.method === 'put') {
      this.put(e as any, e.handler)
    } else if (e.method === 'post') {
      this.post(e as any, e.handler)
    } else if (e.method === 'delete') {
      this.delete(e as any, e.handler)
    } else {
      throw new Error('Unknown method')
    }
  }

  private _makeHandler = <Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>, M extends HTTPMethod>(
    endpoint: Endpoint<Path, I, O, H, M>,
  ) => {
    const { input, headers: headersSchema, handler } = endpoint
    this._mws.push({ type: 'endpoint', endpoint: endpoint as AnyEndpoint })
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { body, headers } = req

      const bodyParseResult = input && input.safeParse(body)
      if (bodyParseResult && bodyParseResult.success === false) {
        return next(new errors.InvalidRequestBodyFormatError(bodyParseResult.error))
      }

      for (const [headerName, headerSchema] of Object.entries(headersSchema ?? {})) {
        const headerValue = headers[headerName]
        const headerParseResult = headerSchema.safeParse(headerValue)
        if (headerParseResult.success === false) {
          return next(new errors.InvalidRequestHeadersFormatError(headerName, headerValue, headerParseResult.error))
        }
      }

      return handler(req as any, res, next)
    }
  }
}
