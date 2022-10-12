import { describe, expect, test, beforeEach, jest } from '@jest/globals'
import express, { Express } from 'express'
import { init } from './prometheus'
import prom from 'prom-client'
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
  beforeEach(() => prom.register.clear())

  test('initialize a middleware on an express app', async () => {
    const app = express()
    const server = await init([app])

    expect(app._router.stack.length).toBe(3)

    server.close()
  })

  test('initialize a middleware on multiple express apps', async () => {
    const app1: any = express()
    const app2: any = express()
    const app3 = express()

    const server = await init([app1, app2])

    expect(app1._router.stack.length).toBe(3)
    expect(app2._router.stack.length).toBe(3)
    expect(app3._router).toBeUndefined()

    expect(app1.promexId).toBeDefined()
    expect(app2.promexId).toBeDefined()

    expect(app1.promexId).not.toBe(app2.promexId)

    server.close()
  })

  test('initialize a callback for each metric request', async () => {
    const callbackErr = jest.fn(async () => {})
    const callbackReq = jest.fn(async () => {
      throw new Error('test')
    })

    const app = express()
    const server = await init([app], 9090, callbackReq, callbackErr)

    await axios.get('http://127.0.0.1:9090/metrics').catch(() => {})

    expect(callbackReq).toHaveBeenCalledTimes(1)
    expect(callbackErr).toHaveBeenCalledTimes(1)

    server.close()
  })

  test('request should use the router of the right express app if multiple are defined', async () => {
    const app1 = express()
    const app2 = express()

    const server = await init([app1, app2])

    app1.get('/', (req, res) => res.end())
    app1.get('/app1/:id/name', (req, res) => res.end())
    app2.post('/app2/:id/name', (req, res) => res.end())

    const app1Server = await listen(app1, 9091)
    const app2Server = await listen(app2, 9092)

    await axios.get('http://127.0.0.1:9091/app1/testid/name')
    await axios.post('http://127.0.0.1:9092/app2/testid/name')
    await axios.get('http://127.0.0.1:9091/')

    const res = await axios.get('http://127.0.0.1:9090/metrics')

    expect(res.data).toContain('http_requests_total{method="get",path="/",status_code="200"} 1')
    expect(res.data).toContain('http_requests_total{method="get",path="/app1/:id/name",status_code="200"} 1')
    expect(res.data).toContain('http_requests_total{method="post",path="/app2/:id/name",status_code="200"} 1')

    server.close()
    app1Server.close()
    app2Server.close()
  }, 30000)

  test('request should use the router of the another express app', async () => {
    const app = express()

    const server = await init([app])

    const appServer = await listen(app, 9091)

    await axios.post('http://127.0.0.1:9091/randompath/that/doesnt/exist').catch(() => {})

    const res = await axios.get('http://127.0.0.1:9090/metrics')

    expect(res.data).toContain('http_requests_total{method="post",path="not_found",status_code="404"} 1')

    server.close()
    appServer.close()
  })
})
