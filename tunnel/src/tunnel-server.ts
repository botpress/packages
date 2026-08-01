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

/** Headers a bridged ws_open forwards to the tail (auth cookies, negotiated subprotocols, origin checks). */
const FORWARDED_VISITOR_HEADERS = ['cookie', 'origin', 'user-agent', 'sec-websocket-protocol', 'x-forwarded-for']

/** ws' close() only accepts 1000 or 3000-4999 — anything else (1001, 1006, …) becomes a normal closure. */
const sendableCloseCode = (code: number | undefined): number =>
  code !== undefined && (code === 1000 || (code >= 3000 && code <= 4999)) ? code : 1000

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
    const pendingFrames: { data: string; binary: boolean }[] = []

    const acceptTimeout = setTimeout(() => finish(1011, 'tunnel websocket accept timed out'), VISITOR_ACCEPT_TIMEOUT_MS)

    const onAccept = (msg: { id: string }) => {
      if (msg.id !== id || finished) return
      accepted = true
      clearTimeout(acceptTimeout)
      for (const frame of pendingFrames.splice(0)) {
        tunnel.sendWebSocketFrame(id, frame.data, frame.binary)
      }
    }
    const onReject = (msg: { id: string; reason?: string }) => {
      if (msg.id !== id) return
      finish(1011, msg.reason ?? 'tunnel websocket rejected')
    }
    const onFrame = (msg: { id: string; data: string; binary?: boolean }) => {
      if (msg.id !== id || finished) return
      ws.send(msg.binary ? Buffer.from(msg.data, 'base64') : msg.data)
    }
    const onClose = (msg: { id: string; code?: number; reason?: string }) => {
      if (msg.id !== id) return
      finish(msg.code, msg.reason)
    }
    const onTunnelClose = () => finish(1001, 'tunnel closed')

    const finish = (code?: number, reason?: string) => {
      if (finished) return
      finished = true
      clearTimeout(acceptTimeout)
      visitors.delete(id)
      tunnel.events.off('ws_accept', onAccept)
      tunnel.events.off('ws_reject', onReject)
      tunnel.events.off('ws_frame', onFrame)
      tunnel.events.off('ws_close', onClose)
      tunnel.events.off('close', onTunnelClose)
      try {
        ws.close(sendableCloseCode(code), reason)
      } catch {
        // already closing
      }
    }

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
        pendingFrames.push({ data, binary })
        return
      }
      tunnel.sendWebSocketFrame(id, data, binary)
    })
    ws.addEventListener('close', (ev: WebSocket.CloseEvent) => {
      if (finished) return
      finished = true
      clearTimeout(acceptTimeout)
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
