import { isBrowser } from 'browser-or-node'
import WebSocket from 'isomorphic-ws'
import * as errors from './errors'
import { EventEmitter } from './event-emitter'
import * as rooting from './rooting'
import {
  Ping,
  Pong,
  TunnelRequest,
  TunnelResponse,
  pingSchema,
  pongSchema,
  tunnelRequestSchema,
  tunnelResponseSchema
} from './types'

const PING_PONG_INTERVAL = 10_000

export type ClientCloseEvent = WebSocket.CloseEvent
export type ClientErrorEvent = WebSocket.Event
export type ClientOpenEvent = WebSocket.Event

export abstract class TunnelClient {
  protected _closed = false
  protected _ev = new EventEmitter<{
    close: ClientCloseEvent
    error: ClientErrorEvent
    message: WebSocket.MessageEvent
    open: WebSocket.Event
    request: TunnelRequest
    response: TunnelResponse
    ping: Ping
    pong: Pong
  }>()

  public constructor(protected _ws: WebSocket) {
    _ws.addEventListener('close', this._wsClose)
    _ws.addEventListener('error', this._wsError)
    _ws.addEventListener('message', this._wsMessage)
    _ws.addEventListener('open', this._wsOpen)
    this._ev.once('close', () => this._handleClose())
  }

  private _wsClose = (ev: WebSocket.CloseEvent) => this._ev.emit('close', ev)
  private _wsError = (ev: WebSocket.Event) => this._ev.emit('error', ev)
  private _wsMessage = (ev: WebSocket.MessageEvent) => this._ev.emit('message', ev)
  private _wsOpen = (ev: WebSocket.Event) => this._ev.emit('open', ev)

  public readonly wait = () => {
    this._throwIfClosed()
    return new Promise<void>((resolve, reject) => {
      this._ev.once('error', (err) => {
        reject(err)
      })
      this._ev.once('close', ({ code, reason }) => {
        if (code === errors.CLOSE_CODES.NORMAL_CLOSURE) {
          resolve()
          return
        }
        const err = new errors.TunnelError(code, reason.toString())
        reject(err)
      })
    })
  }

  public readonly close = (code?: number, reason?: string): void => {
    this._throwIfClosed()
    this._closed = true
    this._ws.close(code ?? errors.CLOSE_CODES.NORMAL_CLOSURE, reason)
  }

  protected _throwIfClosed = () => {
    if (this._closed) {
      throw new Error('tunnel is closed')
    }
  }

  private _handleClose = (): void => {
    this._ws.removeEventListener('close', this._wsClose)
    this._ws.removeEventListener('error', this._wsError)
    this._ws.removeEventListener('message', this._wsMessage)
    this._ws.removeEventListener('open', this._wsOpen)
    this._ev.cleanup()
  }
}

export class TunnelTail extends TunnelClient {
  public readonly events: EventEmitter<{
    close: ClientCloseEvent
    error: ClientErrorEvent
    request: TunnelRequest
    open: ClientOpenEvent
    ping: Ping
  }> = this._ev

  public static new(host: string, tunnelId: string): Promise<TunnelTail> {
    const inst = new TunnelTail(host, tunnelId)
    return new Promise<TunnelTail>((resolve, reject) => {
      inst.events.once('open', () => resolve(inst))
      inst.events.once('error', (err) => reject(err))
    })
  }

  private constructor(host: string, tunnelId: string) {
    const url = rooting.formatUrl(host, tunnelId)

    const headers = { 'User-Agent': 'tunnel-client' } // for firewall
    const socket = isBrowser
      ? new WebSocket(url) // headers are not supported in browser, but the browser will add the User-Agent header automatically
      : new WebSocket(url, { headers })

    super(socket)

    this._ev.on('message', (ev: WebSocket.MessageEvent) => {
      const message = this._parseMessage(ev)
      if (!message) {
        this.close(errors.CLOSE_CODES.INVALID_REQUEST_PAYLOAD, 'invalid request payload')
        return
      }
      if (message.type === 'ping') {
        this.events.emit('ping', message.ping)
        return
      }
      this.events.emit('request', message.request)
    })
  }

  public readonly send = (response: TunnelResponse) => {
    this._throwIfClosed()
    this._ws.send(JSON.stringify(response))
  }

  public readonly pong = () => {
    this._throwIfClosed()
    const pong: Pong = { type: 'pong' }
    this._ws.send(JSON.stringify(pong))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ): { type: 'ping'; ping: Ping } | { type: 'request'; request: TunnelRequest } | undefined => {
    const data = JSON.parse(ev.data.toString())

    const responseParseResult = tunnelRequestSchema.safeParse(data)
    if (responseParseResult.success) {
      return { type: 'request', request: responseParseResult.data }
    }

    const pingParseResult = pingSchema.safeParse(data)
    if (pingParseResult.success) {
      return { type: 'ping', ping: pingParseResult.data }
    }

    return
  }
}

export class TunnelHead extends TunnelClient {
  public readonly events: EventEmitter<{
    close: ClientCloseEvent
    error: ClientErrorEvent
    response: TunnelResponse
    open: ClientOpenEvent
    pong: Pong
  }> = this._ev

  public constructor(public readonly tunnelId: string, ws: WebSocket) {
    super(ws)

    this._ev.on('message', (ev: WebSocket.MessageEvent) => {
      const message = this._parseMessage(ev)
      if (!message) {
        this.close(errors.CLOSE_CODES.INVALID_RESPONSE_PAYLOAD, 'invalid response payload')
        return
      }
      if (message.type === 'pong') {
        this.events.emit('pong', message.pong)
        return
      }
      this.events.emit('response', message.reponse)
    })
  }

  public readonly send = (request: TunnelRequest) => {
    this._throwIfClosed()
    this._ws.send(JSON.stringify(request))
  }

  public readonly ping = () => {
    this._throwIfClosed()
    const ping: Ping = { type: 'ping' }
    this._ws.send(JSON.stringify(ping))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ): { type: 'pong'; pong: Pong } | { type: 'response'; reponse: TunnelResponse } | undefined => {
    const data = JSON.parse(ev.data.toString())

    const responseParseResult = tunnelResponseSchema.safeParse(data)
    if (responseParseResult.success) {
      return { type: 'response', reponse: responseParseResult.data }
    }

    const pongParseResult = pongSchema.safeParse(data)
    if (pongParseResult.success) {
      return { type: 'pong', pong: pongParseResult.data }
    }

    return
  }
}
