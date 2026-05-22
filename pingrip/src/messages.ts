export type Message =
  | { type: 'open' }
  | { type: 'disconnect' }
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'binary'
      content: Buffer
    }
  | {
      type: 'close'
      code: number
    }

const _serializeSingle = (message: Message): Buffer => {
  let content = Buffer.from('')
  if (message.type === 'text') {
    content = Buffer.from(message.content, 'utf8')
  } else if (message.type === 'binary') {
    content = Buffer.from(message.content)
  } else if (message.type === 'close') {
    content = Buffer.alloc(2)
    content.writeUInt16BE(message.code)
  }

  if (content.length === 0) {
    return Buffer.from(message.type.toUpperCase() + '\r\n')
  }
  return Buffer.concat([
    Buffer.from(message.type.toUpperCase() + ` ${content.length.toString(16)}\r\n`),
    content,
    Buffer.from('\r\n')
  ])
}

export const serialize = (messages: Message[]): Buffer => {
  return Buffer.concat(messages.map(_serializeSingle))
}

export class ParseError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export const parse = (body: Buffer): Message[] => {
  const messages: Message[] = []
  while (body.length > 0) {
    const endLineIndex = body.findIndex((byte, i, array) => {
      if (array.length > i) {
        return byte === '\r'.charCodeAt(0) && array[i + 1] === '\n'.charCodeAt(0)
      }
      return false
    })
    if (endLineIndex === -1) {
      throw new ParseError('Could not parse body')
    }

    const command = body.subarray(0, endLineIndex).toString()
    const [type, _length] = command.split(/\s(.*)/s)

    if (!type || !['OPEN', 'CLOSE', 'DISCONNECT', 'TEXT', 'BINARY'].includes(type)) {
      throw new ParseError(`'${type}' is not a valid message type.`)
    }

    const wasLengthProvided = _length !== undefined
    let length = parseInt(_length ?? '0', 16)
    if (length && isNaN(length)) {
      length = 0
    }
    const content = body.subarray(endLineIndex + 2, endLineIndex + 2 + length)
    if (type === 'OPEN') {
      messages.push({ type: 'open' })
    } else if (type === 'DISCONNECT') {
      messages.push({ type: 'disconnect' })
    } else if (type === 'TEXT') {
      messages.push({
        type: 'text',
        content: content.toString()
      })
    } else if (type === 'BINARY') {
      messages.push({
        type: 'binary',
        content
      })
    } else if (type === 'CLOSE' && length === 2) {
      messages.push({
        type: 'close',
        code: content.readUInt16BE(0)
      })
    }
    const newBufferStart = endLineIndex + 2 + (wasLengthProvided ? length + 2 : 0)
    body = body.subarray(newBufferStart)
  }
  return messages
}

type SafeParseResult = { messages: Message[]; error?: undefined } | { messages?: undefined; error: ParseError }

export const safeParse = (body: Buffer): SafeParseResult => {
  try {
    return { messages: parse(body) }
  } catch (error: unknown) {
    if (error instanceof ParseError) {
      return { error }
    }
    return { error: new ParseError(String(error)) }
  }
}
