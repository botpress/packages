# Protobuf Schema

Small wrapper above [protobufjs](https://github.com/protobufjs/protobuf.js) that allows infering a TypeScript type directly from a protobuf schema in a [zod](https://github.com/colinhacks/zod)-like fashion.

Defining a `PTBMessage` allows both to decode/encode data structures and to define types.

## Usage

```ts
import * as ptb from '@bpinternal/ptb-schema'

let userid = 0
const PtbUser = new ptb.PTBMessage('User', {
  email: { id: userid++, rule: 'required', type: 'string' },
  firstName: { id: userid++, rule: 'optional', type: 'string' },
  lastName: { id: userid++, rule: 'optional', type: 'string' },
  birthDate: { id: userid++, rule: 'required', type: 'int32' },
  isStrong: { id: userid++, rule: 'required', type: 'bool' },
  favoriteFood: { id: userid++, rule: 'repeated', type: 'string' }
})

let partyid = 0
const PtbParty = new ptb.PTBMessage('Party', {
  users: { id: partyid++, rule: 'repeated', type: PtbUser }
})

type User = ptb.Infer<typeof PtbUser>
type Party = ptb.Infer<typeof PtbUser>

const eminemBenchPress = 145
const strongThreshold = 225

const eminem: User = {
  email: 'slim.shady@botpress.com',
  firstName: 'eminem',
  lastName: undefined,
  birthDate: Date.now(),
  favoriteFood: ["mom's spaghetthi"],
  isStrong: eminemBenchPress >= strongThreshold
}

const encoded: Uint8Array = PtbParty.encode({
  users: [eminem]
})

console.log('bytes:', encoded.length)

const decoded = PtbParty.decode(encoded)
console.log('decoded:', decoded)
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
