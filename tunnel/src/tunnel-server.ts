import { IncomingMessage } from 'http'
import * as http from 'http'
import WebSocket from 'isomorphic-ws'
import * as errors from './errors'
import { EventEmitter } from './event-emitter'
import * as rooting from './rooting'
import { TunnelHead } from './tunnel-client'

export type TunnelServerProps = {
  port?: number
  server?: http.Server
}

export type ServerErrorEvent = Error
export type ServerCloseEvent = {}
export type ServerListeningEvent = {}
export type ServerConnectionEvent = TunnelHead
export type ServerDisconnectionEvent = { tunnelId: string }

export class TunnelServer {
  private _wss: WebSocket.WebSocketServer
  private _tunnels: Record<string, TunnelHead> = {}
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
    if (parseResult.status === 'error') {
      const code = errors.CLOSE_CODES.INVALID_TUNNEL_ID
      const { reason } = parseResult
      ws.close(code, reason)
      return
    }
    const { tunnelId } = parseResult
    const tunnel = new TunnelHead(tunnelId, ws)
    tunnel.events.once('close', () => this._handleDisconnection(tunnelId))
    this.events.emit('connection', tunnel)
    this._tunnels[tunnelId] = tunnel
  }

  private _handleDisconnection = (tunnelId: string) => {
    delete this._tunnels[tunnelId]
    this.events.emit('disconnection', { tunnelId })
  }

  private _handleClose = (): void => {
    this._wss.removeAllListeners()
    this.events.cleanup()
  }
}
