import { isBrowser } from 'browser-or-node'
import WebSocket from 'isomorphic-ws'
import * as errors from './errors'
import { EventEmitter } from './event-emitter'
import * as rooting from './rooting'
import {
  Hello,
  TunnelRequest,
  TunnelResponse,
  TunnelWsAccept,
  TunnelWsClose,
  TunnelWsFrame,
  TunnelWsOpen,
  TunnelWsReject,
  WS_CAPABILITY,
  headSchema,
  tailSchema
} from './types'

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
    hello: Hello
    ws_open: TunnelWsOpen
    ws_accept: TunnelWsAccept
    ws_reject: TunnelWsReject
    ws_frame: TunnelWsFrame
    ws_close: TunnelWsClose
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

  public readonly hello = (capabilities?: string[]) => {
    this._throwIfClosed()
    const hello: Hello = { type: 'hello', ...(capabilities?.length && { capabilities }) }
    this._ws.send(JSON.stringify(hello))
  }

  /** Relay one WebSocket frame of the bridged connection `id`. */
  public readonly sendWebSocketFrame = (id: string, data: string, binary?: boolean) => {
    this._throwIfClosed()
    const frame: TunnelWsFrame = { type: 'ws_frame', id, data, ...(binary && { binary }) }
    this._ws.send(JSON.stringify(frame))
  }

  /** Close the bridged WebSocket connection `id` on the other end. */
  public readonly closeWebSocket = (id: string, code?: number, reason?: string) => {
    this._throwIfClosed()
    const close: TunnelWsClose = {
      type: 'ws_close',
      id,
      ...(code !== undefined && { code }),
      ...(reason !== undefined && { reason })
    }
    this._ws.send(JSON.stringify(close))
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
    hello: Hello
    ws_open: TunnelWsOpen
    ws_frame: TunnelWsFrame
    ws_close: TunnelWsClose
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
    // The bundled `ws` client throws "Unexpected server response: 101" under
    // Bun; Bun's native WebSocket handles the upgrade correctly and accepts a
    // `{ headers }` option, so prefer it there. Keep `ws` under Node.
    type AnyWebSocketConstructor = new (url: string, options?: unknown) => WebSocket
    const runtime = globalThis as unknown as { Bun?: unknown; WebSocket?: AnyWebSocketConstructor }
    const TunnelWS: AnyWebSocketConstructor =
      runtime.Bun !== undefined && runtime.WebSocket
        ? runtime.WebSocket
        : (WebSocket as unknown as AnyWebSocketConstructor)
    const socket = isBrowser
      ? new TunnelWS(url) // headers are not supported in browser, but the browser will add the User-Agent header automatically
      : new TunnelWS(url, { headers })

    super(socket)

    // Advertise protocol extensions as soon as the tunnel opens — the head
    // only bridges visitor WebSockets to tails that declared support.
    this._ev.once('open', () => {
      try {
        this.hello([WS_CAPABILITY])
      } catch {
        // The tunnel closed between open and hello — nothing to advertise.
      }
    })

    this._ev.on('message', (ev: WebSocket.MessageEvent) => {
      const message = this._parseMessage(ev)
      if (!message) {
        this.close(errors.CLOSE_CODES.INVALID_REQUEST_PAYLOAD, 'invalid request payload')
        return
      }
      if (message.type === 'hello') {
        this.events.emit('hello', message.hello)
        return
      }
      if (message.type === 'request') {
        this.events.emit('request', message.request)
        return
      }
      this.events.emit(message.message.type, message.message as never)
    })
  }

  public readonly send = (response: Omit<TunnelResponse, 'type'>) => {
    this._throwIfClosed()

    const res: TunnelResponse = { type: 'response', ...response }
    this._ws.send(JSON.stringify(res))
  }

  /** Confirm a `ws_open` — frames may flow for this connection from now on. */
  public readonly acceptWebSocket = (id: string, subprotocol?: string) => {
    this._throwIfClosed()
    const accept: TunnelWsAccept = { type: 'ws_accept', id, ...(subprotocol && { subprotocol }) }
    this._ws.send(JSON.stringify(accept))
  }

  /** Refuse a `ws_open` — the head closes the visitor's socket. */
  public readonly rejectWebSocket = (id: string, reason?: string) => {
    this._throwIfClosed()
    const reject: TunnelWsReject = { type: 'ws_reject', id, ...(reason !== undefined && { reason }) }
    this._ws.send(JSON.stringify(reject))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ):
    | { type: 'hello'; hello: Hello }
    | { type: 'request'; request: TunnelRequest }
    | { type: 'ws'; message: TunnelWsOpen | TunnelWsFrame | TunnelWsClose }
    | undefined => {
    const data = JSON.parse(ev.data.toString())

    const parseResult = tailSchema.safeParse(data)
    if (!parseResult.success) {
      return
    }

    if (parseResult.data.type === 'hello') {
      return { type: 'hello', hello: parseResult.data }
    }

    if (
      parseResult.data.type === 'ws_open' ||
      parseResult.data.type === 'ws_frame' ||
      parseResult.data.type === 'ws_close'
    ) {
      return { type: 'ws', message: parseResult.data }
    }

    return { type: 'request', request: parseResult.data }
  }
}

export class TunnelHead extends TunnelClient {
  private _capabilities: Set<string> = new Set()

  public readonly events: EventEmitter<{
    close: ClientCloseEvent
    error: ClientErrorEvent
    response: TunnelResponse
    open: ClientOpenEvent
    hello: Hello
    ws_accept: TunnelWsAccept
    ws_reject: TunnelWsReject
    ws_frame: TunnelWsFrame
    ws_close: TunnelWsClose
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
        for (const capability of message.hello.capabilities ?? []) {
          this._capabilities.add(capability)
        }
        this.events.emit('hello', message.hello)
        return
      }
      if (message.type === 'response') {
        this.events.emit('response', message.response)
        return
      }
      this.events.emit(message.message.type, message.message as never)
    })
  }

  /** True once the tail advertised WebSocket bridging (hello capabilities). */
  public get supportsWebSockets(): boolean {
    return this._capabilities.has(WS_CAPABILITY)
  }

  public readonly send = (request: Omit<TunnelRequest, 'type'>) => {
    this._throwIfClosed()

    const req: TunnelRequest = { type: 'request', ...request }
    this._ws.send(JSON.stringify(req))
  }

  /** Ask the tail to open a bridged WebSocket connection; answered by ws_accept / ws_reject. */
  public readonly openWebSocket = (open: Omit<TunnelWsOpen, 'type'>) => {
    this._throwIfClosed()
    const req: TunnelWsOpen = { type: 'ws_open', ...open }
    this._ws.send(JSON.stringify(req))
  }

  private _parseMessage = (
    ev: WebSocket.MessageEvent
  ):
    | { type: 'hello'; hello: Hello }
    | { type: 'response'; response: TunnelResponse }
    | { type: 'ws'; message: TunnelWsAccept | TunnelWsReject | TunnelWsFrame | TunnelWsClose }
    | undefined => {
    const data = JSON.parse(ev.data.toString())

    const parseResult = headSchema.safeParse(data)
    if (!parseResult.success) {
      return
    }

    if (parseResult.data.type === 'hello') {
      return { type: 'hello', hello: parseResult.data }
    }

    if (
      parseResult.data.type === 'ws_accept' ||
      parseResult.data.type === 'ws_reject' ||
      parseResult.data.type === 'ws_frame' ||
      parseResult.data.type === 'ws_close'
    ) {
      return { type: 'ws', message: parseResult.data }
    }

    return { type: 'response', response: parseResult.data }
  }
}
