import { createMiddleware, defaultNormalizers, signalIsUp } from '@promster/express'
import { getSummary, getContentType } from '@promster/metrics'
import type { Express, Request, Response } from 'express'
import http from 'http'
import { nanoid } from 'nanoid'

type Route = {
  prefix?: RegExp
  subroutes?: Route[]
  methods?: { [key: string]: boolean }
  regexp?: RegExp
  path: string
}

type RequestListener = (req: http.IncomingMessage) => Promise<void>
type ErrorListener = (req: http.IncomingMessage, err: unknown) => Promise<void>

type AppRoute = {
  [key: string]: {
    app: Express
    routes: Route[]
  }
}

type MetricListeners = {
  onRequests: RequestListener[]
  onErrors: ErrorListener[]
}

const APP_NOT_FOUND = 'app_not_found'
const NOT_FOUND = 'not_found'

/**
 * Global variable are not the best, but it's the only way to do it with promster since it redeclares the global metrics.
 * If the middleware was not declaring the global metrics, we could have prevented this.
 */

let server: http.Server | undefined
let middleware: ReturnType<typeof createMiddleware> | undefined
let appRoutes: AppRoute = {}
const listeners: MetricListeners = { onRequests: [], onErrors: [] }

const trimPrefix = (value: string, prefix: string) => (value.startsWith(prefix) ? value.slice(prefix.length) : value)

const getMiddlewareRoutes = (middleware: any) => {
  const routes: Route[] = []

  if (middleware.route) {
    routes.push({
      path: middleware.route.path,
      regexp: middleware.regexp,
      methods: middleware.route?.methods
    })
  }

  if (middleware.name === 'router' && middleware.handle.stack) {
    const subroutes: Route[] = []

    for (const subMiddleware of middleware.handle.stack) {
      subroutes.push(...getMiddlewareRoutes(subMiddleware))
    }

    if (subroutes.length) {
      routes.push({
        prefix: middleware.regexp,
        path: middleware.path || '',
        subroutes
      })
    }
  }

  return routes
}

const getRoutes = (app: Express) => {
  const routes: Route[] = []

  for (const middleware of app._router.stack) {
    routes.push(...getMiddlewareRoutes(middleware))
  }

  return routes
}

const getRoutesPath = (path: string, method: string, routes: Route[], prefix = ''): string => {
  for (const route of routes) {
    if (route.prefix && route.subroutes) {
      if (route.prefix.test(path)) {
        return getRoutesPath(trimPrefix(path, route.path), method, route.subroutes, route.path)
      }
    } else if (route.regexp) {
      if (route.regexp.test(path) && route.methods?.[method]) {
        return `${prefix}${route.path}`
      }
    }
  }

  return NOT_FOUND
}

/**
 * this function adds a little overhead to the request since it duplicates the logic of the router
 * but it gives the path of the route that was matched to the prometheus middleware.
 * @param app Express app
 * @returns A normalized path for the given request using the app routes
 */
const normalizePath =
  () =>
  (path: string, { req }: { req: Request; res: Response }) => {
    const appId = (req.app as any).promexId

    const appRoute = appRoutes[appId]

    if (!appRoute) {
      return APP_NOT_FOUND
    }

    const routes = appRoute.routes

    if (!routes.length) {
      routes.push(...getRoutes(appRoute.app))
    }

    return getRoutesPath(path, req.method.toLowerCase(), routes)
  }

const initAppRoute = (app: Express) => {
  const id = nanoid()

  ;(app as any).promexId = id

  appRoutes[id] = {
    app,
    routes: []
  }
}

const createServer = () =>
  http.createServer(async (req, res) => {
    try {
      if (listeners.onRequests.length) {
        await Promise.all(listeners.onRequests.map((listener) => listener(req)))
      }

      res.writeHead(200, 'OK', { 'content-type': getContentType() })
      res.end(await getSummary())
    } catch (e) {
      if (listeners.onErrors.length) {
        await Promise.all(listeners.onErrors.map((listener) => listener(req, e)))
      }

      res.writeHead(500, 'Internal Server Error')
      res.end()
    }
  })

/**
 * initialize prometheus metrics for an express app
 * it automatically starts a server to expose the metrics
 * @param apps Express apps
 * @param port port of the metric server to listen to
 * @param onRequest callback to be called before the metrics are returned
 * @param onError callback to be called when an error occurs
 */
export const init = async (app: Express, onRequest?: RequestListener, onError?: ErrorListener) => {
  if (!middleware) {
    middleware = createMiddleware({
      options: {
        ...defaultNormalizers,
        normalizePath: normalizePath() as any, // The type of normalizePath is wrong
        buckets: [0.05, 0.1, 0.5, 1, 3]
      }
    })
  }

  initAppRoute(app)

  app.use(middleware)

  if (onRequest) {
    listeners.onRequests.push(onRequest)
  }

  if (onError) {
    listeners.onErrors.push(onError)
  }
}

export const start = async (port = 9090) =>
  new Promise(async (resolve, reject) => {
    signalIsUp()

    if (!server) {
      server = createServer()

      server.once('error', reject)
      server.once('listening', () => {
        resolve(undefined)
      })

      server.listen(port, '0.0.0.0')
    } else {
      resolve(undefined)
    }
  })

export const stop = () =>
  new Promise(async (resolve) => {
    if (server) {
      server.close(() => {
        server = undefined
        resolve(undefined)
      })
    } else {
      resolve(undefined)
    }
  })

/**
 * reset removes all the routes and listeners from the app
 * this is useful for testing
 */
export const reset = async () => {
  await stop()
  middleware = undefined
  listeners.onErrors = []
  listeners.onRequests = []
  appRoutes = {}
}
