import * as messages from './messages'
import { type Message } from './messages'

export { GripPublisher } from './publisher'

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

  unsubscribe(channels: string[]) {
    for (const channel of channels) {
      this._pushText(`c:${JSON.stringify({ type: 'unsubscribe', channel })}`)
    }
    return this
  }

  toResponse(): Response {
    return {
      body: messages.serialize(this._messages),
      headers: {}
    }
  }

  _pushText(content: string) {
    this._messages.push({
      type: 'text',
      content
    })
  }

  _pushBinary(content: Buffer) {
    this._messages.push({
      type: 'binary',
      content
    })
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
  constructor(private _builder: ResponseBuilder) {}

  keepAlive(content: string, timeout: number) {
    if (timeout < 30) {
      throw new Error(`Keep Alive timeout should be at least 30 secondes. ${timeout} was given.`)
    }
    this._builder._pushText(`c:${JSON.stringify({ type: 'keep-alive', content, timeout })}`)
    return this
  }

  text(content: string) {
    this._builder._pushText(`m:${content}`)
    return this
  }

  binary(content: Buffer) {
    this._builder._pushBinary(Buffer.concat([Buffer.from('m:'), content]))
    return this
  }

  subscribe(channels: string[]) {
    for (const channel of channels) {
      this._builder._pushText(`c:${JSON.stringify({ type: 'subscribe', channel })}`)
    }
    return this
  }

  toResponse(): Response {
    const { body } = this._builder.toResponse()
    return {
      body,
      headers: {
        'Content-Type': 'application/websocket-events',
        'Sec-WebSocket-Extensions': 'grip'
      }
    }
  }
}
