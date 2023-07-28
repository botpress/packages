# Opapi (OpenAPI)

> Opapi is a highly opinionated library to generate server, client and documentation from OpenAPI specification using typescript.

## Usage

Install the package and start creating your OpenAPI specification. See the example below

```ts
import { OpenApi, schema } from '@bpinternal/opapi'
import { z } from 'zod'

const api = OpenApi({
  metadata: {
    title: 'Example API', // This is the title of the API
    description: 'Description of this api', // This is the description of the API
    server: 'https://api.example.com', // This is the base URL of the API
    version: '0.1.0', // This is the version of the API
    prefix: 'v1', // This prefix will be added to all routes
  },
  // This is metadata to be used in the documentation
  section: {
    User: {
      tilte: 'User',
      description: 'User related endpoints',
    },
  },
  // This is where you define your schemas that will be used in the API
  // You can use the `ref` function to reference a schema
  schemas: {
    User: {
      section: 'User', // This is the section where this schema will be displayed in the documentation
      schema: schema(
        z.object({
          id: z.string(),
          name: z.string(),
        }),
        {
          description: 'User schema',
        },
      ),
    },
  },
  // This is the error definitions that will be used in the API
  errors: [
    {
      status: 403,
      type: 'Forbidden',
      description: "The requested action can't be peform by this resource.",
    },
    {
      status: 400,
      type: 'InvalidPayload',
      description: "The request payload isn't invalid.",
    },
    {
      status: 405,
      type: 'MethodNotFound',
      description: 'The requested method does not exist.',
    },
  ],
})

api.addOperation({
  name: 'listUsers',
  description: 'List all users',
  method: 'get',
  path: '/users',
  section: 'User',
  parameters: {
    name: {
      in: 'query',
      type: 'string',
      description: 'Name filter for the users',
    },
  },
  response: {
    description: 'Returns a list of User objects.',
    schema: z.object({
      users: openapi.getModelRef('User'),
    }),
  },
})

api.exportServer('./gen/server') // This will generate a server that can be used with any framework
api.exportClient('./gen/client') // This will generate a client that can be used to query the API
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.
