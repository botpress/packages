import { Logger } from '@bpinternal/log4bot'
import { TunnelTail, TunnelServer, TunnelResponse, TunnelRequest, ClientCloseEvent } from '../src'
import { CLOSE_CODES } from '../src/errors'
import { expect } from './utils'

const TUNNEL_ID = 'some-tunnel-id'
const REQUEST_ID = 'some-request-id'
const REQUEST_BODY = 'Hello'
const RESPONSE_BODY = 'World'

export const testSuccess = async (port: number, logger: Logger) => {
  const server = await TunnelServer.new({ port })
  const responsePromise = new Promise<TunnelResponse>((resolve) => {
    server.events.on('connection', (tunnelHead) => {
      logger.debug(`connection: "${tunnelHead.tunnelId}"`)
      tunnelHead.events.onceOrMore('response', (response) => {
        if (response.requestId !== REQUEST_ID) {
          return 'keep-listening'
        }
        logger.debug(`received response: ${JSON.stringify(response, null, 2)}`)
        resolve(response)
        return 'stop-listening'
      })
    })
  })

  const tunnelTail = await TunnelTail.new(`ws://localhost:${port}`, TUNNEL_ID)
  tunnelTail.events.on('hello', () => {
    logger.info('tail received hello, sending hello back...')
    tunnelTail.hello()
  })

  const requestPromise = new Promise<TunnelRequest>((resolve) => {
    tunnelTail.events.on('request', (request) => {
      logger.debug(`received request: ${JSON.stringify(request, null, 2)}`)
      tunnelTail.send({
        requestId: request.id,
        status: 200,
        headers: {},
        body: RESPONSE_BODY
      })
      resolve(request)
    })
  })

  const tunnelHead = server.getTunnel(TUNNEL_ID)
  if (!tunnelHead) {
    throw new Error(`Tunnel ${TUNNEL_ID} not found`)
  }

  const helloPromise = new Promise<void>((resolve) => {
    tunnelHead.events.once('hello', () => {
      logger.info('head received hello')
      resolve()
    })
  })
  tunnelHead.hello()

  tunnelHead.send({
    id: REQUEST_ID,
    method: 'GET',
    path: '/hello',
    headers: {},
    body: REQUEST_BODY
  })

  const successPromise = Promise.all([requestPromise, responsePromise, helloPromise])

  const serverExitPromise = server.wait().then(() => {
    throw new Error('Server exited')
  })

  const tunnelClosedPromise = tunnelTail.wait().then(() => {
    throw new Error('Tunnel closed')
  })

  const [request, response] = await Promise.race([successPromise, serverExitPromise, tunnelClosedPromise])

  tunnelTail.close()
  server.close()

  expect(request.id).toBe(REQUEST_ID)
  expect(request.body).toBe(REQUEST_BODY)

  expect(response.requestId).toBe(REQUEST_ID)
  expect(response.body).toBe(RESPONSE_BODY)
}

export const testInvalidRequest = async (port: number, logger: Logger) => {
  const server = await TunnelServer.new({ port })

  const tunnelTail = await TunnelTail.new(`ws://localhost:${port}`, TUNNEL_ID)

  const tunnelClosedPromise = new Promise<ClientCloseEvent>((resolve) => tunnelTail.events.on('close', resolve))

  const requestPromise = new Promise<TunnelRequest>((resolve) => {
    tunnelTail.events.on('request', (request) => {
      logger.debug(`received request: ${JSON.stringify(request, null, 2)}`)
      tunnelTail.send({
        requestId: request.id,
        status: 200,
        headers: {},
        body: RESPONSE_BODY
      })
      resolve(request)
    })
  })

  const tunnelHead = server.getTunnel(TUNNEL_ID)
  if (!tunnelHead) {
    throw new Error(`Tunnel ${TUNNEL_ID} not found`)
  }

  logger.debug('sending invalid request...')
  tunnelHead.send({
    id: REQUEST_ID,
    method: 'GET',
    url: '/hello'
  } as any) // invalid request schema

  const requestReceivedPromise = requestPromise.then(() => {
    throw new Error('tunnel tail received request')
  })

  const serverExitPromise = server.wait().then(() => {
    throw new Error('Server exited')
  })

  logger.debug('waiting for tunnel to close...')
  const { code } = await Promise.race([tunnelClosedPromise, requestReceivedPromise, serverExitPromise])

  server.close()

  expect(code).toBe(CLOSE_CODES.INVALID_REQUEST_PAYLOAD)
}
