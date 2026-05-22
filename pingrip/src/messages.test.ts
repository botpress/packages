import { describe, it, expect } from 'vitest'
import { serialize, parse, safeParse, ParseError, type Message } from './messages'

describe('messages', () => {
  describe('serialize', () => {
    it('should serialize an open message', () => {
      const messages: Message[] = [{ type: 'open' }]
      const result = serialize(messages)
      expect(result.toString()).toBe('OPEN\r\n')
    })

    it('should serialize a disconnect message', () => {
      const messages: Message[] = [{ type: 'disconnect' }]
      const result = serialize(messages)
      expect(result.toString()).toBe('DISCONNECT\r\n')
    })

    it('should serialize a text message', () => {
      const messages: Message[] = [{ type: 'text', content: 'Hello World' }]
      const result = serialize(messages)
      expect(result.toString()).toBe('TEXT b\r\nHello World\r\n')
    })

    it('should serialize a binary message', () => {
      const content = Buffer.from([0x01, 0x02, 0x03])
      const messages: Message[] = [{ type: 'binary', content }]
      const result = serialize(messages)
      const expected = Buffer.concat([Buffer.from('BINARY 3\r\n'), content, Buffer.from('\r\n')])
      expect(result).toEqual(expected)
    })

    it('should serialize a close message', () => {
      const messages: Message[] = [{ type: 'close', code: 1000 }]
      const result = serialize(messages)
      const expected = Buffer.concat([
        Buffer.from('CLOSE 2\r\n'),
        Buffer.from([0x03, 0xe8]), // 1000 in big-endian
        Buffer.from('\r\n')
      ])
      expect(result).toEqual(expected)
    })

    it('should serialize multiple messages', () => {
      const messages: Message[] = [{ type: 'open' }, { type: 'text', content: 'Hi' }, { type: 'close', code: 1000 }]
      const result = serialize(messages)
      expect(result.toString('utf8', 0, 6)).toBe('OPEN\r\n')
    })

    it('should handle empty text content', () => {
      const messages: Message[] = [{ type: 'text', content: '' }]
      const result = serialize(messages)
      expect(result.toString()).toBe('TEXT\r\n')
    })
  })

  describe('parse', () => {
    it('should parse an open message', () => {
      const buffer = Buffer.from('OPEN\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'open' }])
    })

    it('should parse a disconnect message', () => {
      const buffer = Buffer.from('DISCONNECT\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'disconnect' }])
    })

    it('should parse a text message', () => {
      const buffer = Buffer.from('TEXT 5\r\nHello\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'text', content: 'Hello' }])
    })

    it('should parse a binary message', () => {
      const content = Buffer.from([0x01, 0x02, 0x03])
      const buffer = Buffer.concat([Buffer.from('BINARY 3\r\n'), content, Buffer.from('\r\n')])
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'binary', content }])
    })

    it('should parse a close message', () => {
      const closeCode = Buffer.alloc(2)
      closeCode.writeUInt16BE(1000)
      const buffer = Buffer.concat([Buffer.from('CLOSE 2\r\n'), closeCode, Buffer.from('\r\n')])
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'close', code: 1000 }])
    })

    it('should parse multiple messages', () => {
      const buffer = Buffer.from('OPEN\r\nTEXT 2\r\nHi\r\nDISCONNECT\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'open' }, { type: 'text', content: 'Hi' }, { type: 'disconnect' }])
    })

    it('should throw ParseError on invalid message type', () => {
      const buffer = Buffer.from('INVALID\r\n')
      expect(() => parse(buffer)).toThrow(ParseError)
      expect(() => parse(buffer)).toThrow("'INVALID' is not a valid message type.")
    })

    it('should throw ParseError on missing line ending', () => {
      const buffer = Buffer.from('OPEN')
      expect(() => parse(buffer)).toThrow(ParseError)
      expect(() => parse(buffer)).toThrow('Could not parse body')
    })

    it('should handle empty text message', () => {
      const buffer = Buffer.from('TEXT 0\r\n\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'text', content: '' }])
    })

    it('should handle empty text message without content length', () => {
      const buffer = Buffer.from('TEXT\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'text', content: '' }])
    })

    it('should parse hexadecimal length correctly', () => {
      const buffer = Buffer.from('TEXT a\r\n0123456789\r\n')
      const result = parse(buffer)
      expect(result).toEqual([{ type: 'text', content: '0123456789' }])
    })
  })

  describe('round-trip serialization', () => {
    it('should maintain data integrity for open message', () => {
      const original: Message[] = [{ type: 'open' }]
      const serialized = serialize(original)
      const parsed = parse(serialized)
      expect(parsed).toEqual(original)
    })

    it('should maintain data integrity for text message', () => {
      const original: Message[] = [{ type: 'text', content: 'Hello World!' }]
      const serialized = serialize(original)
      const parsed = parse(serialized)
      expect(parsed).toEqual(original)
    })

    it('should maintain data integrity for binary message', () => {
      const original: Message[] = [{ type: 'binary', content: Buffer.from([0x00, 0xff, 0x42]) }]
      const serialized = serialize(original)
      const parsed = parse(serialized)
      expect(parsed).toEqual(original)
    })

    it('should maintain data integrity for close message', () => {
      const original: Message[] = [{ type: 'close', code: 1001 }]
      const serialized = serialize(original)
      const parsed = parse(serialized)
      expect(parsed).toEqual(original)
    })

    it('should maintain data integrity for multiple messages', () => {
      const original: Message[] = [
        { type: 'open' },
        { type: 'text', content: 'test' },
        { type: 'binary', content: Buffer.from([0x01]) },
        { type: 'close', code: 1000 },
        { type: 'disconnect' }
      ]
      const serialized = serialize(original)
      const parsed = parse(serialized)
      expect(parsed).toEqual(original)
    })
  })

  describe('safeParse', () => {
    it('should return messages on successful parse', () => {
      const buffer = Buffer.from('OPEN\r\n')
      const result = safeParse(buffer)
      expect(result.error).toBeUndefined()
      expect(result.messages).toEqual([{ type: 'open' }])
    })

    it('should return error on parse failure', () => {
      const buffer = Buffer.from('INVALID\r\n')
      const result = safeParse(buffer)
      expect(result.messages).toBeUndefined()
      expect(result.error).toBeInstanceOf(ParseError)
      expect(result.error?.message).toContain('INVALID')
    })

    it('should return ParseError on malformed input', () => {
      const buffer = Buffer.from('OPEN')
      const result = safeParse(buffer)
      expect(result.messages).toBeUndefined()
      expect(result.error).toBeInstanceOf(ParseError)
      expect(result.error?.message).toBe('Could not parse body')
    })

    it('should handle empty buffer', () => {
      const buffer = Buffer.from('')
      const result = safeParse(buffer)
      expect(result.error).toBeUndefined()
      expect(result.messages).toEqual([])
    })
  })

  describe('edge cases', () => {
    it('should handle very long text messages', () => {
      const longText = 'a'.repeat(10000)
      const messages: Message[] = [{ type: 'text', content: longText }]
      const serialized = serialize(messages)
      const parsed = parse(serialized)
      expect(parsed).toEqual(messages)
    })

    it('should handle binary data with null bytes', () => {
      const content = Buffer.from([0x00, 0x00, 0x00])
      const messages: Message[] = [{ type: 'binary', content }]
      const serialized = serialize(messages)
      const parsed = parse(serialized)
      expect(parsed).toEqual(messages)
    })

    it('should handle close code 0', () => {
      const messages: Message[] = [{ type: 'close', code: 0 }]
      const serialized = serialize(messages)
      const parsed = parse(serialized)
      expect(parsed).toEqual(messages)
    })

    it('should handle max close code (65535)', () => {
      const messages: Message[] = [{ type: 'close', code: 65535 }]
      const serialized = serialize(messages)
      const parsed = parse(serialized)
      expect(parsed).toEqual(messages)
    })
  })
})
