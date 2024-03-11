import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import express, { Express } from 'express'
import * as promex from './prometheus'
import prom from 'prom-client'
import { defaultNormalizers } from '@promster/express'
import axios from 'axios'
import { Server } from 'http'

const listen = (app: Express, port: number) => {
  return new Promise<Server>((resolve, reject) => {
    const server = app.listen(port)
    server.once('listening', () => resolve(server))
    server.once('error', reject)
  })
}

describe('init function', () => {
  afterEach(async () => {
    await promex.reset()
    prom.register.clear()
  })

  test('initialize a middleware on an express app', async () => {
    const app = express()

    promex.init(app)
    await promex.start()

    expect(app._router.stack.length).toBe(3)
  })

  test('initialize a middleware on multiple express apps', async () => {
    const app1: any = express()
    const app2: any = express()
    const app3 = express()

    promex.init(app1)
    promex.init(app2)
    await promex.start()

    expect(app1._router.stack.length).toBe(3)
    expect(app2._router.stack.length).toBe(3)
    expect(app3._router).toBeUndefined()

    expect(app1.promexId).toBeDefined()
    expect(app2.promexId).toBeDefined()

    expect(app1.promexId).not.toBe(app2.promexId)
  })

  test('initialize a callback for each metric request', async () => {
    const callbackErr = vi.fn(async () => { })
    const callbackReq = vi.fn(async () => {
      throw new Error('test')
    })

    const app = express()
    promex.init(app)
    await promex.start({ onRequest: callbackReq, onError: callbackErr })

    await axios.get('http://127.0.0.1:9090/metrics').catch(() => { })

    expect(callbackReq).toHaveBeenCalledTimes(1)
    expect(callbackErr).toHaveBeenCalledTimes(1)
  })

  test('should use the router of the right express app if multiple are defined', async () => {
    const app1 = express()
    const app2 = express()

    promex.init(app1)
    promex.init(app2)
    await promex.start()

    app1.get('/', (_, res) => res.end())
    app1.get('/app1/:id/name', (_, res) => res.end())
    app2.post('/app2/:id/name', (_, res) => res.end())

    const app1Server = await listen(app1, 9091)
    const app2Server = await listen(app2, 9092)

    await axios.get('http://127.0.0.1:9091/app1/testid/name')
    await axios.post('http://127.0.0.1:9092/app2/testid/name')
    await axios.get('http://127.0.0.1:9091/')

    const res = await axios.get('http://127.0.0.1:9090/metrics')

    expect(res.data).toContain('http_requests_total{method="get",path="/",status_code="200"} 1')
    expect(res.data).toContain('http_requests_total{method="get",path="/app1/:id/name",status_code="200"} 1')
    expect(res.data).toContain('http_requests_total{method="post",path="/app2/:id/name",status_code="200"} 1')

    app1Server.close()
    app2Server.close()
  })

  test("should set undefined path label if the express app doesn't match any path", async () => {
    const app = express()

    promex.init(app)
    await promex.start()

    const appServer = await listen(app, 9091)

    await axios.post('http://127.0.0.1:9091/randompath/that/doesnt/exist').catch(() => { })

    const res = await axios.get('http://127.0.0.1:9090/metrics')

    expect(res.data).toContain('http_requests_total{method="post",path="not_found",status_code="404"} 1')

    appServer.close()
  })

  test('should start & stop idempotent functions without issues', async () => {
    const app = express()

    promex.init(app)
    await promex.start()
    await promex.start()

    await axios.get('http://127.0.0.1:9090/metrics')

    await promex.stop()
    await promex.start()

    await axios.get('http://127.0.0.1:9090/metrics')

    await promex.stop()
    await promex.stop()
  })

  test('should add a handler on an express app', async () => {
    const app = express()

    app.get('/metrics', promex.handler())

    promex.init(app)

    app.get('/', (_, res) => res.end())

    const appServer = await listen(app, 9091)

    await axios.get('http://127.0.0.1:9091/')

    const res = await axios.get('http://127.0.0.1:9091/metrics')

    expect(res.data).toContain('http_requests_total{method="get",path="/",status_code="200"} 1')

    appServer.close()
  })

  test('should not use the default normalize path', async () => {
    const app = express()

    promex.config({ normalizePath: defaultNormalizers.normalizePath })
    promex.init(app)

    app.get('/metrics', promex.handler())
    app.get('/foo/:id/bar', (_, res) => res.end())

    const appServer = await listen(app, 9091)

    await axios.get('http://127.0.0.1:9091/foo/d3d6966e-4883-44b7-9ea4-59dae0326001/bar')

    const res = await axios.get('http://127.0.0.1:9091/metrics')

    expect(res.data).toContain('http_requests_total{method="get",path="/foo/#val/bar",status_code="200"} 1')
    expect((app as any).promexId).toBeUndefined()

    appServer.close()
  })
})
