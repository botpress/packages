import { createMiddleware, defaultNormalizers, signalIsUp } from '@promster/express'
import { getContentType, getSummary } from '@promster/metrics'
import type { Express } from 'express'
import { resetAppRoutes, initAppRoute, normalizePath } from './normalize-path'
import http from 'http'

type RequestListener = (req: http.IncomingMessage) => Promise<void>
type ErrorListener = (req: http.IncomingMessage, err: unknown) => Promise<void>

/**
 * Global variable are not the best, but it's the only way to do it with promster since it redeclares the global metrics.
 * If the middleware was not declaring the global metrics, we could have prevented this.
 */

let server: http.Server | undefined
let promsterMiddleware: ReturnType<typeof createMiddleware> | undefined
let defaultNormalizedPathEnabled = true

type TOptionalPromsterOptions = NonNullable<Parameters<typeof createMiddleware>[0]>['options']

/**
 * config is used to setup the global promster middleware
 * @param options for the promster middleware
 * @returns the configured promster middleware
 */
export const config = (options: TOptionalPromsterOptions = {}): ReturnType<typeof createMiddleware> => {
  if (options.normalizePath) {
    defaultNormalizedPathEnabled = false
  }

  if (!promsterMiddleware) {
    promsterMiddleware = createMiddleware({
      options: {
        ...defaultNormalizers,
        normalizePath: normalizePath() as any, // The type of normalizePath is wrong any is required
        metricBuckets: {
          httpRequestDurationInSeconds: [0.05, 0.1, 0.5, 1, 3, 10, 60, 120],
        },
        ...options,
      }
    })
  }

  return promsterMiddleware
}

/**
 * initialize prometheus metrics for an express app
 * this must be called before any route is defined
 * @warning the config function cannot be called after this function
 * @param app Express app
 */
export const init = (app: Express) => {
  const configuredMiddleware = config()

  if (defaultNormalizedPathEnabled) {
    initAppRoute(app)
  }

  app.use(configuredMiddleware)
}

export const handler = (onRequest?: RequestListener, onError?: ErrorListener) => {
  signalIsUp()

  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      if (onRequest) {
        await onRequest(req)
      }

      res.writeHead(200, 'OK', { 'content-type': getContentType() })
      res.end(await getSummary())
    } catch (e) {
      if (onError) {
        await onError(req, e)
      }

      res.writeHead(500, 'Internal Server Error')
      res.end()
    }
  }
}

type StartOptions = {
  onRequest?: RequestListener
  onError?: ErrorListener
  port?: number
}

/**
 * Starts the Prometheus metrics server
 */
export const start = ({ port = 9090, onRequest, onError }: StartOptions = {}) =>
  new Promise((resolve, reject) => {
    if (server) {
      resolve(undefined)
      return
    }

    server = http.createServer(handler(onRequest, onError))

    server.once('error', reject)
    server.once('listening', () => resolve(undefined))

    server.listen(port, '0.0.0.0')
  })

/**
 * Stop the Prometheus metrics server
 */
export const stop = () =>
  new Promise((resolve) => {
    if (!server) {
      resolve(undefined)
      return
    }

    server.close(() => {
      server = undefined
      resolve(undefined)
    })
  })

/**
 * reset removes all the routes and listeners from the app
 * this is useful for testing
 */
export const reset = async () => {
  await stop()
  resetAppRoutes()
  promsterMiddleware = undefined
}
