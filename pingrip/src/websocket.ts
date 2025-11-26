import * as messages from './messages'
import { type Message } from './messages'

export type Response = {
  body: Buffer
  headers: Record<string, string>
}

export class ResponseBuilder {
  private _messages: Message[] = []

  open(): OpenResponseBuilder {
    this._messages.push({
      type: 'open'
    })
    return new OpenResponseBuilder(this)
  }

  close(code: number): CloseResponseBuilder {
    this._messages.push({
      type: 'close',
      code
    })
    return new CloseResponseBuilder(this)
  }

  text(content: string) {
    this._messages.push({
      type: 'text',
      content
    })
    return this
  }

  binary(content: Buffer) {
    this._messages.push({
      type: 'binary',
      content
    })
    return this
  }

  unsubscribe(channels: string[]) {
    for (const channel of channels) {
      this.text(`c:${JSON.stringify({ type: 'unsubscribe', channel })}`)
    }
    return this
  }

  toResponse(): Response {
    return {
      body: messages.serialize(this._messages),
      headers: {}
    }
  }
}

class CloseResponseBuilder {
  constructor(private _builder: ResponseBuilder) {}

  unsubscribe(channels: string[]) {
    this._builder.unsubscribe(channels)
    return this
  }

  toResponse(): Response {
    return this._builder.toResponse()
  }
}

class OpenResponseBuilder {
  private _keepAliveMessage: string | null = null
  private _keepAliveTimeout: number | null = null
  private _channels: string[] = []

  constructor(private _builder: ResponseBuilder) {}

  keepAlive(message: string, timeout: number) {
    if (timeout < 30) {
      throw new Error(`Keep Alive timeout should be at least 30 secondes. ${timeout} was given.`)
    }
    this._keepAliveTimeout = timeout
    this._keepAliveMessage = message
    return this
  }

  text(content: string) {
    this._builder.text(content)
    return this
  }

  binary(content: Buffer) {
    this._builder.binary(content)
    return this
  }

  subscribe(channels: string[]) {
    for (const channel of channels) {
      this._channels.push(channel)
      this.text(`c:${JSON.stringify({ type: 'subscribe', channel })}`)
    }
    return this
  }

  toResponse(): Response {
    const { body } = this._builder.toResponse()
    const headers: Record<string, string> = {
      'Content-Type': 'application/websocket-events',
      'Grip-Hold': 'stream',
      'Sec-WebSocket-Extensions': 'grip'
    }
    if (this._channels.length > 0) {
      headers['Grip-Channel'] = this._channels.join(',')
    }
    if (this._keepAliveMessage !== null && this._keepAliveTimeout) {
      const b64KeepAlive = Buffer.from(this._keepAliveMessage, 'utf-8').toString('base64')
      headers['Grip-Keep-Alive'] = `${b64KeepAlive}; format=base64; timeout=${this._keepAliveTimeout};`
    }
    return {
      body,
      headers
    }
  }
}
