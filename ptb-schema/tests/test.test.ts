
import { PTBMessage, Infer } from '../src/index'
import { describe, test, expect } from 'vitest'


const Message = new PTBMessage('Message', {
  id: { id: 1, type: 'string', rule: 'required' },
})

type MessageType = Infer<typeof Message>

type Equal<X, Y> = X extends Y ? (Y extends X ? true : false) : false
type Expect<C extends true> = C
type _ExpectMessageType = Expect<Equal<MessageType, { id: string }>>

describe('PTBMessage', () => {
  test('should create a Message', () => {
    const data = Message.encode({ id: '1' })

    expect(data).toBeDefined()

    const decoded = Message.decode(data)

    expect(decoded).toEqual({ id: '1' })
  })
})
