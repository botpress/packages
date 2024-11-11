# Jex

JSON-Extends; JSON Schema type checking library

## Usage

```typescript
import * as jex from '.'

const res1 = jex.jsonSchemaExtends(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  },
  {
    type: 'object',
    properties: {
      name: { type: 'string' }
    }
  }
)
console.log(res1) // true

const res2 = jex.jsonSchemaExtends(
  {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' }
    }
  },
  {
    type: 'object',
    properties: {
      name: { type: 'string' }
    },
    required: ['name']
  }
)
console.log(res2) // false
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.
