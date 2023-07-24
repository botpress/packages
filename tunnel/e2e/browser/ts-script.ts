import { TunnelTail } from '../../src'
import { TUNNEL_ID, RESPONSE_BODY } from './constants'

const json = <T>(obj: T): string => JSON.stringify(obj, null, 2)

const port = process.env.PORT! // string-replaced in the test

const main = async () => {
  console.info('connecting to server')
  const tunnelTail = await TunnelTail.new(`ws://localhost:${port}`, TUNNEL_ID)
  console.info('connected to server')

  await new Promise<void>((resolve) => {
    tunnelTail.events.on('request', (request) => {
      console.info('received request:', json(request))
      tunnelTail.send({
        requestId: request.id,
        status: 200,
        headers: {},
        body: RESPONSE_BODY
      })
      resolve()
    })

    tunnelTail.events.on('hello', () => {
      console.info('tail received hello, sending hello back...')
      tunnelTail.hello()
    })
  })
}
void main()
  .then(() => {})
  .catch((err) => {
    console.error('ERROR', err.message)
  })
