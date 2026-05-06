import { describe, it, expect } from 'vitest'
import { ResponseBuilder } from './outputs'
import { parse } from './messages'

describe('OpenResponseBuilder', () => {
  it('text() prepends "m:" to the content', () => {
    const { body } = new ResponseBuilder().open().text('hello').toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([{ type: 'open' }, { type: 'text', content: 'm:hello' }])
  })

  it('subscribe() emits one "c:" prefixed frame per channel', () => {
    const { body } = new ResponseBuilder().open().subscribe(['conv_X', 'user_Y']).toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([
      { type: 'open' },
      { type: 'text', content: `c:${JSON.stringify({ type: 'subscribe', channel: 'conv_X' })}` },
      { type: 'text', content: `c:${JSON.stringify({ type: 'subscribe', channel: 'user_Y' })}` }
    ])
  })

  it('keepAlive() emits a "c:" prefixed keep-alive control frame', () => {
    const { body } = new ResponseBuilder().open().keepAlive('ping', 30).toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([
      { type: 'open' },
      { type: 'text', content: `c:${JSON.stringify({ type: 'keep-alive', content: 'ping', timeout: 30 })}` }
    ])
  })

  it('subscribe() and text() emit independent frames', () => {
    const { body } = new ResponseBuilder().open().subscribe(['conv_X']).text('hello').toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([
      { type: 'open' },
      { type: 'text', content: `c:${JSON.stringify({ type: 'subscribe', channel: 'conv_X' })}` },
      { type: 'text', content: 'm:hello' }
    ])
  })

  it('binary() prepends "m:" to the buffer', () => {
    const payload = Buffer.from([0x01, 0x02, 0x03])
    const { body } = new ResponseBuilder().open().binary(payload).toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([{ type: 'open' }, { type: 'binary', content: Buffer.concat([Buffer.from('m:'), payload]) }])
  })
})

describe('ResponseBuilder.unsubscribe', () => {
  it('emits "c:" prefixed frames', () => {
    const { body } = new ResponseBuilder().close(1000).unsubscribe(['conv_X']).toResponse()
    const parsed = parse(body)
    expect(parsed).toEqual([
      { type: 'close', code: 1000 },
      { type: 'text', content: `c:${JSON.stringify({ type: 'unsubscribe', channel: 'conv_X' })}` }
    ])
  })
})
