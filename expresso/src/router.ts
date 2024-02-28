import bodyparser from 'body-parser'
import express from 'express'
import httpErrors from 'http-errors'
import _ from 'lodash'
import { InfoObject, OpenAPIObject } from 'openapi3-ts/oas31'
import swaggerExpress, { SwaggerUiOptions } from 'swagger-ui-express'
import { z } from 'zod'
import { generateCliDocumentation } from './cli-doc'
import * as errors from './errors'
import { generateOpenAPI } from './openapi'
import { redocHtml } from './redoc'
import { EndpointProps, EndpointHandler, AnyEndpoint, Endpoint, HTTPMethod } from './typings'



const OPENAPI_DEFAULT_URL = '/openapi.json'
const REDOC_DEFAULT_URL = '/redoc'

export type CustomInfo = Partial<InfoObject> & {
  /** Add custom schemas to the API definition */
  schemas?: Record<string, z.ZodTypeAny>
}

export type JsonRouterProps = {
  info: CustomInfo
  bodySize: string | number
  /** The path under which all endpoints of this router will reside */
  basePath: string
}

type Serve = {
  /**
   * Display the swagger express page to query the API directly
   */
  swagger?: {
    enabled: boolean
    /**
     * The URL where the swagger interface will be displayed
     * @default /
     */
    url?: string
  } & SwaggerUiOptions
  /**
   * Serve the OpenAPI JSON file for the active router
   */
  openApi?: {
    enabled: boolean
    /**
     * URL of the OpenAPI Json Definition
     * @default /openapi.json
     */
    url?: string
    /**
     * Method to edit the API Object before returning it to the user (ex: change an header value for another one)
     */
    editDoc?: (doc: OpenAPIObject) => OpenAPIObject
    /**
     * Provides a clean documentation generated from the OpenAPI JSON file
     */
    redoc?: {
      enabled: boolean
      /**
       * URL where redoc will be available. It is feeded from the openApi previously configured.
       * @default /redoc
       */
      url?: string
    }
  }
}

const DEFAULT_INFO: InfoObject = { title: 'XoApp', version: '1.0.0' }
const DEFAULT_PROPS: JsonRouterProps = { info: DEFAULT_INFO, bodySize: '1mb', basePath: '' }

export class JsonRouter {
  private _endpoints: AnyEndpoint[] = []
  private _router: express.IRouter
  private _props: JsonRouterProps
  private _basePath: string
  public children: JsonRouter[] = []

  constructor(props: Partial<JsonRouterProps> = {}) {
    this._basePath = props.basePath!
    this._props = { ...DEFAULT_PROPS, ...props }

    const router = express.Router({ mergeParams: false })
    router.use(bodyparser.json({ limit: props.bodySize }))
    router.use((thrown, _req, _res, next) => {
      if (httpErrors.isHttpError(thrown)) {
        return next(new errors.HTTPError(thrown))
      }
      return next(thrown)
    })

    this._router = router
  }

  public get basePath(): string {
    return this._basePath
  }

  /** Adds a child router. The path is defined when you create the router. */
  public addRouter(subRouter: JsonRouter) {
    this.children.push(subRouter)

    this._router.use(subRouter.basePath, subRouter.inner)
  }

  /**
   * Provide a list of routes to copy to the current router (ex: same logic but different version of an API)
   * If no paths are provided, all routes from this router will be copied to the target router, except if they already exist
   * */
  public copyRoutesFromRouter(router: JsonRouter, paths?: { path: string; method: string }[]) {
    if (paths) {
      _.intersectionBy(router._endpoints, paths, (x) => `${x.path}${x.method}`).forEach((x) => this._addEndpoint(x))
    } else {
      _.differenceBy(router._endpoints, this._endpoints, (x) => `${x.path}${x.method}`).forEach((x) =>
        this._addEndpoint(x)
      )
    }
  }

  /**
   * Serves the various routers.
   * - Swagger can only be enabled once (ideally at the root router).
   * - OpenAPI can be enabled to have an individual openapi.json file per router. Child routes will be displayed on the parent even if this is not enabled
   * */
  public serve({ swagger, openApi }: Serve) {
    if (openApi?.enabled) {
      this._setupOpenApiRouter({ openApi })
    }

    if (swagger) {
      this._router.use(swagger.url || '/', swaggerExpress.serve)
      this._router.get(swagger.url || '/', swaggerExpress.setup(undefined, swagger))
    }
  }

  /** Access the underlying Express router. Avoid if not necessary */
  public get inner(): express.IRouter {
    return this._router
  }

  public get openapi() {
    const resolved = { ...DEFAULT_INFO, ...this._props.info }
    const endpoints = this._getAllEndpoints(this)
    return generateOpenAPI(endpoints, resolved)
  }

  public get cliDoc() {
    const endpoints = this._getAllEndpoints(this)
    return generateCliDocumentation(endpoints)
  }

  public get<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    ...handlers: Array<EndpointHandler<Path, I, O, H>>
  ) {
    return this._router.get(info.path, this._validationMw({ ...info, method: 'get' }), this._wrapHandlers(handlers))
  }

  public put<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    ...handlers: Array<EndpointHandler<Path, I, O, H>>
  ) {
    return this._router.put(info.path, this._validationMw({ ...info, method: 'put' }), this._wrapHandlers(handlers))
  }

  public post<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    ...handlers: Array<EndpointHandler<Path, I, O, H>>
  ) {
    return this._router.post(info.path, this._validationMw({ ...info, method: 'post' }), this._wrapHandlers(handlers))
  }

  public delete<Path extends string, I extends z.ZodType, O extends z.ZodType, H extends Record<string, z.ZodString>>(
    info: EndpointProps<Path, I, O, H>,
    ...handlers: Array<EndpointHandler<Path, I, O, H>>
  ) {
    return this._router.delete(
      info.path,
      this._validationMw({ ...info, method: 'delete' }),
      this._wrapHandlers(handlers)
    )
  }

  /** Adds an error handle. Must be added last on your router */
  public addErrorHandler(handler: express.ErrorRequestHandler) {
    this._router.use(handler)
  }

  /** Adds an endpoint to the router. This is used when copying method across routers */
  private _addEndpoint = (e: AnyEndpoint) => {
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

  /** This middleware registers the endpoint and simply validate the input based on schemas */
  private _validationMw = <
    Path extends string,
    I extends z.ZodType,
    O extends z.ZodType,
    H extends Record<string, z.ZodString>,
    M extends HTTPMethod
  >(
    endpoint: Partial<Endpoint<Path, I, O, H, M>>
  ) => {
    const { input, headers: headersSchema } = endpoint
    this._endpoints.push(endpoint as AnyEndpoint)

    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const { body, headers } = req

      if (input) {
        const parsedBody = input.safeParse(body)

        if (parsedBody.success) {
          // Assign the parsed body back to the request body, so optional parameters are defined as per the schema
          req.body = parsedBody.data
        } else {
          return next(new errors.InvalidRequestBodyFormatError(parsedBody.error))
        }
      }

      for (const [headerName, headerSchema] of Object.entries(headersSchema ?? {})) {
        const headerValue = headers[headerName]
        const headerParseResult = headerSchema.safeParse(headerValue)
        if (headerParseResult.success === false) {
          return next(new errors.InvalidRequestHeadersFormatError(headerName, headerValue, headerParseResult.error))
        }
      }

      next()
    }
  }

  private _wrapHandlers = <
    Path extends string,
    I extends z.ZodType,
    O extends z.ZodType,
    H extends Record<string, z.ZodString>
  >(
    handlers: Array<EndpointHandler<Path, I, O, H>>
  ) => {
    return handlers.map(
      (handler) => async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
          await handler(req as any, res, next)
        } catch (thrown) {
          next(thrown)
        }
      }
    )
  }

  /** Returns all the endpoints of the specified router, including its children, with the correct path */
  private _getAllEndpoints(router: JsonRouter) {
    const allEndpoints = [...router._endpoints]
    if (router.children.length) {
      allEndpoints.push(..._.flatMap(router.children, (x) => this._getAllEndpoints(x)))
    }

    return router.basePath ? allEndpoints.map((e) => ({ ...e, path: `${router.basePath}${e.path}` })) : allEndpoints
  }

  private _setupOpenApiRouter({ openApi }: Partial<Serve>) {
    if (!openApi?.enabled) {
      return
    }

    this._router.get(openApi.url || OPENAPI_DEFAULT_URL, async (req, res, next) => {
      try {
        let specs = this.openapi.getSpec()
        if (openApi.editDoc) {
          specs = openApi.editDoc(specs)
        }

        res.send(specs)
        return next()
      } catch (thrown) {
        return next(thrown)
      }
    })

    if (openApi.redoc?.enabled) {
      this._router.get(openApi.redoc.url || REDOC_DEFAULT_URL, async (req, res, next) => {
        // We remove the leading slash so it doesn't fall under /redoc/openapi
        const openApiUrl = `${openApi.url || OPENAPI_DEFAULT_URL}`.replace(/^\//, '')

        try {
          res.send(redocHtml(openApiUrl))
          return next()
        } catch (thrown) {
          return next(thrown)
        }
      })
    }
  }
}
