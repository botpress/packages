import { IncomingMessage } from 'http'
import * as http from 'http'
import WebSocket from 'isomorphic-ws'
import * as errors from './errors'
import { EventEmitter } from './event-emitter'
import * as rooting from './rooting'
import { TunnelHead } from './tunnel-client'
import { TunnelHeader } from './types'

export type TunnelServerProps = {
  port?: number
  server?: http.Server
}

export type ServerErrorEvent = Error
export type ServerCloseEvent = {}
export type ServerListeningEvent = {}
export type ServerConnectionEvent = TunnelHead
export type ServerDisconnectionEvent = { tunnelId: string }

/** How long a visitor socket waits for the tail's ws_accept before giving up. */
const VISITOR_ACCEPT_TIMEOUT_MS = 10_000

/**
 * Frames a visitor sends before the tail accepts are buffered (the visitor's
 * upgrade already completed — it cannot know the handshake is in flight).
 * The visitor is unauthenticated at this point, so the buffer is hard-capped;
 * exceeding it closes the socket instead of holding attacker-controlled bytes.
 */
const MAX_PENDING_FRAMES = 64
const MAX_PENDING_BYTES = 256 * 1024

/** Headers a bridged ws_open forwards to the tail (auth cookies, origin checks). */
const FORWARDED_VISITOR_HEADERS = ['cookie', 'origin', 'user-agent', 'x-forwarded-for']

/** Only codes an endpoint may SEND (RFC 6455): reserved ones (1005, 1006, …) become a normal closure. */
const sendableCloseCode = (code: number | undefined): number =>
  code !== undefined && ((code >= 1000 && code <= 1003) || (code >= 1007 && code <= 1011) || (code >= 3000 && code <= 4999))
    ? code
    : 1000

const visitorConnectionId = (): string =>
  `wsc_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`

export class TunnelServer {
  private _wss: WebSocket.WebSocketServer
  private _tunnels: Record<string, TunnelHead> = {}
  private _visitors: Record<string, Map<string, WebSocket>> = {}
  private _closed = false

  public readonly events = new EventEmitter<{
    error: ServerErrorEvent
    close: ServerCloseEvent
    listening: ServerListeningEvent
    connection: ServerConnectionEvent
    disconnection: ServerDisconnectionEvent
  }>()

  public static new(props: TunnelServerProps): Promise<TunnelServer> {
    const inst = new TunnelServer(props)

    if (props.server) {
      // If we're given a server, we don't need to wait for it to start listening
      return Promise.resolve(inst)
    }

    return new Promise<TunnelServer>((resolve, reject) => {
      inst.events.once('listening', () => resolve(inst))
      inst.events.once('error', (err) => reject(err))
    })
  }

  private constructor(props: TunnelServerProps) {
    if (!WebSocket.WebSocketServer) {
      throw new Error('Cannot instantiate TunnelServer in the browser')
    }

    this._wss = new WebSocket.WebSocketServer({ server: props.server, port: props.port })
    this._wss.on('error', (err) => this.events.emit('error', err))
    this._wss.on('close', () => this.events.emit('close', {}))
    this._wss.on('listening', () => this.events.emit('listening', {}))
    this._wss.on('connection', this._handleConnection)
    this.events.once('close', () => this._handleClose())
  }

  public wait = () => {
    this._throwIfClosed()
    return new Promise<void>((resolve, reject) => {
      this.events.once('error', (err) => reject(err))
      this.events.once('close', () => resolve())
    })
  }

  public getTunnel = (tunnelId: string): TunnelHead | undefined => {
    this._throwIfClosed()
    return this._tunnels[tunnelId]
  }

  public close = (): void => {
    this._throwIfClosed()
    this._closed = true
    this._wss.close()
  }

  private _throwIfClosed = () => {
    if (this._closed) {
      throw new Error('tunnel is closed')
    }
  }

  private _handleConnection = (ws: WebSocket, req: IncomingMessage) => {
    const parseResult = rooting.parseUrl(req.url)
    if (parseResult.status === 'success') {
      this._handleTailConnection(ws, parseResult.tunnelId)
      return
    }

    // Not a tail registration (`/:tunnelId`): a public visitor upgrading a
    // WebSocket against a path served by the tail (`/:tunnelId/:path`).
    const publicResult = rooting.parsePublicUrl(req.url)
    if (publicResult.status === 'success') {
      this._handleVisitorConnection(ws, req, publicResult)
      return
    }

    ws.close(errors.CLOSE_CODES.INVALID_TUNNEL_ID, parseResult.reason)
  }

  private _handleTailConnection = (ws: WebSocket, tunnelId: string) => {
    if (this._tunnels[tunnelId]) {
      ws.close(errors.CLOSE_CODES.TUNNEL_ID_CONFLICT, 'tunnel ID already in use')
      return
    }

    const tunnel = new TunnelHead(tunnelId, ws)
    tunnel.events.once('close', () => this._handleDisconnection(tunnelId))
    this.events.emit('connection', tunnel)

    this._tunnels[tunnelId] = tunnel
  }

  /**
   * Bridge a visitor's WebSocket to the tail: ws_open asks the tail to dial
   * its local counterpart, then frames relay in both directions until either
   * side closes. Frames the visitor sends before the tail accepts are
   * buffered — the visitor has no way to know the handshake is still in
   * flight (its upgrade already completed).
   */
  private _handleVisitorConnection = (
    ws: WebSocket,
    req: IncomingMessage,
    target: { tunnelId: string; path: string; query?: string }
  ) => {
    const tunnel = this._tunnels[target.tunnelId]
    if (!tunnel) {
      ws.close(errors.CLOSE_CODES.INVALID_TUNNEL_ID, 'tunnel not found')
      return
    }
    if (!tunnel.supportsWebSockets) {
      ws.close(errors.CLOSE_CODES.WS_UNSUPPORTED, 'tunnel does not support websocket bridging')
      return
    }

    const id = visitorConnectionId()
    const visitors = (this._visitors[target.tunnelId] ??= new Map())
    visitors.set(id, ws)

    const headers: Record<string, TunnelHeader> = {}
    for (const name of FORWARDED_VISITOR_HEADERS) {
      const value = req.headers[name]
      if (value !== undefined) headers[name] = value
    }

    let accepted = false
    let finished = false
    let pendingBytes = 0
    const pendingFrames: { data: string; binary: boolean }[] = []

    const teardown = (opts: { visitorCode?: number; visitorReason?: string; notifyTail: boolean }) => {
      if (finished) return
      finished = true
      clearTimeout(acceptTimeout)
      pendingFrames.length = 0
      visitors.delete(id)
      tunnel.events.off('ws_accept', onAccept)
      tunnel.events.off('ws_reject', onReject)
      tunnel.events.off('ws_frame', onFrame)
      tunnel.events.off('ws_close', onClose)
      tunnel.events.off('close', onTunnelClose)
      if (opts.notifyTail && !tunnel.closed) {
        try {
          tunnel.closeWebSocket(id, opts.visitorCode, opts.visitorReason)
        } catch {
          // tunnel raced shut — nothing to notify
        }
      }
      try {
        ws.close(sendableCloseCode(opts.visitorCode), opts.visitorReason)
      } catch {
        // already closing
      }
    }

    const acceptTimeout = setTimeout(
      // Notify the tail: a late accept would otherwise stream into the void.
      () => teardown({ visitorCode: 1011, visitorReason: 'tunnel websocket accept timed out', notifyTail: true }),
      VISITOR_ACCEPT_TIMEOUT_MS
    )

    const onAccept = (msg: { id: string }) => {
      if (msg.id !== id || finished) return
      accepted = true
      clearTimeout(acceptTimeout)
      for (const frame of pendingFrames.splice(0)) {
        tunnel.sendWebSocketFrame(id, frame.data, frame.binary)
      }
      pendingBytes = 0
    }
    const onReject = (msg: { id: string; reason?: string }) => {
      if (msg.id !== id) return
      teardown({ visitorCode: 1011, visitorReason: msg.reason ?? 'tunnel websocket rejected', notifyTail: false })
    }
    const onFrame = (msg: { id: string; data: string; binary?: boolean }) => {
      if (msg.id !== id || finished) return
      ws.send(msg.binary ? Buffer.from(msg.data, 'base64') : msg.data)
    }
    const onClose = (msg: { id: string; code?: number; reason?: string }) => {
      if (msg.id !== id) return
      teardown({ visitorCode: msg.code, visitorReason: msg.reason, notifyTail: false })
    }
    const onTunnelClose = () => teardown({ visitorCode: 1001, visitorReason: 'tunnel closed', notifyTail: false })

    tunnel.events.on('ws_accept', onAccept)
    tunnel.events.on('ws_reject', onReject)
    tunnel.events.on('ws_frame', onFrame)
    tunnel.events.on('ws_close', onClose)
    tunnel.events.on('close', onTunnelClose)

    ws.addEventListener('message', (ev: WebSocket.MessageEvent) => {
      if (finished) return
      const binary = typeof ev.data !== 'string'
      const data = binary ? Buffer.from(ev.data as Buffer).toString('base64') : (ev.data as string)
      if (!accepted) {
        // Unauthenticated bytes: hard-capped, never held indefinitely.
        if (pendingFrames.length >= MAX_PENDING_FRAMES || pendingBytes + data.length > MAX_PENDING_BYTES) {
          teardown({ visitorCode: 1009, visitorReason: 'too much data before tunnel accept', notifyTail: true })
          return
        }
        pendingBytes += data.length
        pendingFrames.push({ data, binary })
        return
      }
      tunnel.sendWebSocketFrame(id, data, binary)
    })
    ws.addEventListener('close', (ev: WebSocket.CloseEvent) => {
      if (finished) return
      finished = true
      clearTimeout(acceptTimeout)
      pendingFrames.length = 0
      visitors.delete(id)
      tunnel.events.off('ws_accept', onAccept)
      tunnel.events.off('ws_reject', onReject)
      tunnel.events.off('ws_frame', onFrame)
      tunnel.events.off('ws_close', onClose)
      tunnel.events.off('close', onTunnelClose)
      if (!tunnel.closed) {
        try {
          tunnel.closeWebSocket(id, ev.code, ev.reason?.toString())
        } catch {
          // tunnel raced shut — nothing to notify
        }
      }
    })
    ws.addEventListener('error', () => {
      // close event follows and owns the cleanup
    })

    tunnel.openWebSocket({ id, path: target.path, ...(target.query !== undefined && { query: target.query }), headers })
  }

  private _handleDisconnection = (tunnelId: string) => {
    delete this._tunnels[tunnelId]
    delete this._visitors[tunnelId]
    this.events.emit('disconnection', { tunnelId })
  }

  private _handleClose = (): void => {
    this._wss.removeAllListeners()
    this.events.cleanup()
  }
}
