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
