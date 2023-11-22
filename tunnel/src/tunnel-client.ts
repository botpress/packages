import { isBrowser } from 'browser-or-node'
import WebSocket from 'isomorphic-ws'
import * as errors from './errors'
import { EventEmitter } from './event-emitter'
import * as rooting from './rooting'
import { Hello, TunnelRequest, TunnelResponse, headSchema, tailSchema } from './types'

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
    hello: {}
  }>()

  public get closed() {
    return this._closed
  }

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

  public readonly hello = () => {
    this._throwIfClosed()
    const hello: Hello = { type: 'hello' }
    this._ws.send(JSON.stringify(hello))
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
    hello: {}
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
      if (message.type === 'hello') {
        this.events.emit('hello', {})
        return
      }
      this.events.emit('request', message.request)
    })
  }

  public readonly send = (response: Omit<TunnelResponse, 'type'>) => {
    this._throwIfClosed()

    const res: TunnelResponse = { type: 'response', ...response }
    this._ws.send(JSON.stringify(res))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ): { type: 'hello' } | { type: 'request'; request: TunnelRequest } | undefined => {
    const data = JSON.parse(ev.data.toString())

    const parseResult = tailSchema.safeParse(data)
    if (!parseResult.success) {
      return
    }

    if (parseResult.data.type === 'hello') {
      return { type: 'hello' }
    }

    return { type: 'request', request: parseResult.data }
  }
}

export class TunnelHead extends TunnelClient {
  public readonly events: EventEmitter<{
    close: ClientCloseEvent
    error: ClientErrorEvent
    response: TunnelResponse
    open: ClientOpenEvent
    hello: {}
  }> = this._ev

  public constructor(public readonly tunnelId: string, ws: WebSocket) {
    super(ws)

    this._ev.on('message', (ev: WebSocket.MessageEvent) => {
      const message = this._parseMessage(ev)
      if (!message) {
        this.close(errors.CLOSE_CODES.INVALID_RESPONSE_PAYLOAD, 'invalid response payload')
        return
      }
      if (message.type === 'hello') {
        this.events.emit('hello', {})
        return
      }
      this.events.emit('response', message.reponse)
    })
  }

  public readonly send = (request: Omit<TunnelRequest, 'type'>) => {
    this._throwIfClosed()

    const req: TunnelRequest = { type: 'request', ...request }
    this._ws.send(JSON.stringify(req))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ): { type: 'hello' } | { type: 'response'; reponse: TunnelResponse } | undefined => {
    const data = JSON.parse(ev.data.toString())

    const parseResult = headSchema.safeParse(data)
    if (!parseResult.success) {
      return
    }

    if (parseResult.data.type === 'hello') {
      return { type: 'hello' }
    }

    return { type: 'response', reponse: parseResult.data }
  }
}
