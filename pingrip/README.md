# PinGrip

PinGrip is an implementation of the Pushpin GRIP for WebSocket-over-HTTP tunneling. It provides utilities for
serializing and parsing WebSocket messages in the GRIP protocol format, and includes a fluent ResponseBuilder API for
constructing WebSocket responses with support for opening/closing connections, sending text/binary messages, subscribing
to channels, and configuring keep-alive behavior.

## Usage

```js
import * as messages from './messages'
import * as ws from './websocket'
import { GripPublisher } from './publisher'

const grip = new GripPublisher({
  signalUrl: 'http://localhost:7999',
})

function onDataUpdate(channels: string[]) {
  const payload = "myPayloadToSendToAClient"
  grip.publish(channels, payload)
}

/**
  * A handler that receive requests and generate responses
  */
function handler(body: string) {
  const channels = ['channel1', 'channel2'] // extract channels from the body for example
  const { messages: _messages, error } = messages.safeParse(Buffer.from(body))
  if (error) {
    console.error(error)
    return
  }
  for (const message of _messages) {
    if (message.type === 'open') {
      const response = new ws.ResponseBuilder()
        .open()
        .subscribe(channels)
        .keepAlive('ping', 30)
        .toResponse()
      return response
    }
    if (message.type === 'close') {
      const response = new ws.ResponseBuilder()
        .close(message.code)
        .unsubscribe(channels)
        .toResponse()
      return response
    }
  }
}
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. Since the packages are catered to our own use-cases, they might have less stable APIs, receive breaking changes without much warning, have minimal documentation and lack community-focused support. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install or fork this package feel absolutly free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
