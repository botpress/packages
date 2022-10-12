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

const APP_NOT_FOUND = 'app_not_found'
const NOT_FOUND = 'not_found'

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
const normalizePath = (apps: Express[]) => {
  const appRoutes: { [key: string]: { app: Express; routes: Route[] } } = {}

  for (const app of apps) {
    const id = nanoid()

    ;(app as any).promexId = id

    appRoutes[id] = {
      app,
      routes: []
    }
  }

  return (path: string, { req }: { req: Request; res: Response }) => {
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
}

const createServer = (
  port: number,
  onRequest?: (req: http.IncomingMessage) => Promise<void>,
  onError?: (req: http.IncomingMessage, error: any) => Promise<void>
) =>
  new Promise<http.Server>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        if (onRequest) {
          await onRequest(req)
        }

        res.writeHead(200, 'OK', { 'content-type': getContentType() })
        res.end(await getSummary())
      } catch (e) {
        if (onError) {
          onError(req, e)
        }

        res.writeHead(500, 'Internal Server Error')
        res.end()
      }
    })

    server.once('error', reject)
    server.once('listening', () => resolve(server))

    server.listen(port, '0.0.0.0')
  })

/**
 * initialize prometheus metrics for an express app
 * it automatically starts a server to expose the metrics
 * @param apps Express apps
 * @param port port of the metric server to listen to
 * @param onRequest callback to be called before the metrics are returned
 * @param onError callback to be called when an error occurs
 */
export const init = async (
  apps: Express[] = [],
  port = 9090,
  onRequest?: (req: http.IncomingMessage) => Promise<void>,
  onError?: (req: http.IncomingMessage, error: any) => Promise<void>
) => {
  const middleware = createMiddleware({
    options: {
      ...defaultNormalizers,
      normalizePath: normalizePath(apps) as any, // The type of normalizePath is wrong
      buckets: [0.05, 0.1, 0.5, 1, 3]
    }
  })

  for (const app of apps) {
    app.use(middleware)
  }

  const server = await createServer(port, onRequest, onError)

  return server
}
