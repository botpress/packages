import type { Express, Request, Response } from 'express'
import { nanoid } from 'nanoid'

type Route = {
  prefix?: RegExp
  subroutes?: Route[]
  methods?: { [key: string]: boolean }
  regexp?: RegExp
  path: string
}

type AppRoute = {
  [key: string]: {
    app: Express
    routes: Route[]
  }
}

const APP_NOT_FOUND = 'app_not_found'
const NOT_FOUND = 'not_found'

let appRoutes: AppRoute = {}

/**
 * this function adds a little overhead to the request since it duplicates the logic of the router
 * but it gives the path of the route that was matched to the prometheus middleware.
 * @returns A normalized path for the given request using the app routes
 */
export const normalizePath =
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

const getRoutes = (app: Express) => {
  const routes: Route[] = []

  for (const middleware of app._router.stack) {
    routes.push(...getMiddlewareRoutes(middleware))
  }

  return routes
}

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

export const initAppRoute = (app: Express) => {
  const id = nanoid()

  ;(app as any).promexId = id

  appRoutes[id] = {
    app,
    routes: []
  }
}

export const resetAppRoutes = () => {
  appRoutes = {}
}
