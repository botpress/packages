import { Logger } from '@bpinternal/log4bot'
import WebSocket from 'isomorphic-ws'
import { TunnelTail, TunnelServer } from '../src'
import { CLOSE_CODES } from '../src/errors'
import { expect } from './utils'

const TUNNEL_ID = 'ws-tunnel-id'

/**
 * A visitor WebSocket dialed against `/:tunnelId/:path` bridges through the
 * tunnel: the tail sees ws_open with the visitor's path/query, frames relay
 * in both directions, and a visitor close reaches the tail.
 */
export const testWebSocketBridge = async (port: number, logger: Logger) => {
  const server = await TunnelServer.new({ port })
  const tunnelTail = await TunnelTail.new(`ws://localhost:${port}`, TUNNEL_ID)

  // The tail acts as the local endpoint: accept every ws_open, echo every
  // frame back with a prefix, and record the close.
  const opened = new Promise<{ path: string; query?: string }>((resolve) => {
    tunnelTail.events.on('ws_open', (msg) => {
      logger.debug(`tail ws_open: ${JSON.stringify(msg)}`)
      tunnelTail.acceptWebSocket(msg.id)
      resolve({ path: msg.path, ...(msg.query !== undefined && { query: msg.query }) })
    })
  })
  tunnelTail.events.on('ws_frame', (msg) => {
    logger.debug(`tail ws_frame: ${JSON.stringify(msg)}`)
    tunnelTail.sendWebSocketFrame(msg.id, `echo:${msg.data}`, msg.binary)
  })
  const tailSawClose = new Promise<{ code?: number }>((resolve) => {
    tunnelTail.events.on('ws_close', (msg) => resolve({ code: msg.code }))
  })

  // The tail must advertise the ws capability before the visitor connects
  // (its hello is sent on open; wait for the head to have processed it).
  const head = server.getTunnel(TUNNEL_ID)
  if (!head) throw new Error(`Tunnel ${TUNNEL_ID} not found`)
  for (let i = 0; i < 50 && !head.supportsWebSockets; i++) {
    await new Promise((r) => setTimeout(r, 20))
  }
  expect(String(head.supportsWebSockets)).toBe('true')

  const visitor = new WebSocket(`ws://localhost:${port}/${TUNNEL_ID}/edge/bots/b1/conversations/c1/ws?token=t1`)
  const received: string[] = []
  const gotEcho = new Promise<string>((resolve) => {
    visitor.addEventListener('message', (ev: WebSocket.MessageEvent) => {
      received.push(ev.data.toString())
      resolve(ev.data.toString())
    })
  })
  // Send before the tail accepts on purpose — the server must buffer it.
  visitor.addEventListener('open', () => visitor.send('hello-through-tunnel'))

  const { path, query } = await opened
  expect(path).toBe('/edge/bots/b1/conversations/c1/ws')
  expect(query ?? '').toBe('token=t1')

  const echoed = await gotEcho
  expect(echoed).toBe('echo:hello-through-tunnel')

  visitor.close(1000, 'done')
  await tailSawClose

  tunnelTail.close()
  server.close()
}

/** A visitor upgrading against a tail that never advertised `ws` is refused cleanly. */
export const testWebSocketUnsupported = async (port: number, _logger: Logger) => {
  const server = await TunnelServer.new({ port })
  const tunnelTail = await TunnelTail.new(`ws://localhost:${port}`, TUNNEL_ID)

  const head = server.getTunnel(TUNNEL_ID)
  if (!head) throw new Error(`Tunnel ${TUNNEL_ID} not found`)
  // Simulate a pre-websocket tail: let the on-open hello land, then wipe the
  // advertised capability (wiping first would race the hello repopulating it).
  for (let i = 0; i < 50 && !head.supportsWebSockets; i++) {
    await new Promise((r) => setTimeout(r, 20))
  }
  ;(head as unknown as { _capabilities: Set<string> })._capabilities = new Set()

  const visitor = new WebSocket(`ws://localhost:${port}/${TUNNEL_ID}/some/path`)
  const closed = await new Promise<WebSocket.CloseEvent>((resolve) => visitor.addEventListener('close', resolve))
  expect(String(closed.code)).toBe(String(CLOSE_CODES.WS_UNSUPPORTED))

  tunnelTail.close()
  server.close()
}
