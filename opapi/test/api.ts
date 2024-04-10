import { z } from 'zod'
import { OpenApi, schema } from '../src'

const fooSchema = z.object({
  id: z.string(),
  name: z.string(),
})

const Bar = schema(
  z.object({
    tags: z.record(
      schema(
        z.object({
          title: schema(z.string().max(20).optional(), { description: 'Title of the tag' }),
          description: schema(z.string().max(100).optional(), { description: 'Description of the tag' }),
        }),
        { description: 'Definition of a tag that can be provided on the object' },
      ),
    ),
  }),
  { description: 'Conversation object configuration' },
)

const nestedSchema = z.object({
  id: z.string(),
  properties: z.object({
    name: z.string(),
    propertiesL2: z.object({
      name: z.string(),
      propertiesL3: z.object({
        name: z.string(),
      }),
    }),
  }),
  bar: Bar.optional(),
})

export const getMockApi = () => {
  const api = OpenApi({
    errors: [
      {
        description: 'Foo not found',
        status: 404,
        type: 'FooNotFound',
      },
    ],
    metadata: {
      title: 'Test API',
      description: 'Test API',
      server: 'http://localhost:3000',
      version: '1.0.0',
      prefix: '/v1',
    },
    sections: {
      foo: {
        title: 'Foo',
        description: 'Foo section',
      },
      bar: {
        title: 'Bar',
        description: 'Bar section',
      },
      nested: {
        title: 'Nested',
        description: 'Nested section',
      },
    },
    schemas: {
      Foo: {
        section: 'foo',
        schema: fooSchema,
      },
      Nested: {
        section: 'nested',
        schema: nestedSchema,
      },
      Bar: {
        section: 'bar',
        schema: z.object({}),
      },
    },
  })

  api.addOperation({
    name: 'getFoo',
    description: 'Get a foo',
    method: 'get',
    path: '/foos/{id}',
    parameters: {
      id: {
        in: 'path',
        type: 'string',
        description: 'Foo id',
      },
    },
    section: 'foo',
    response: {
      description: 'Foo information',
      schema: z.object({
        foo: api.getModelRef('Foo'),
      }),
    },
  })

  api.addOperation({
    name: 'postFoo',
    description: 'Post a foo',
    method: 'post',
    path: '/foos/{id}',
    parameters: {
      id: {
        in: 'path',
        type: 'string',
        description: 'Foo id',
      },
    },
    requestBody: {
      description: 'Foo information',
      schema: schema(z.record(z.any()), { description: 'Foo information' }),
    },
    section: 'foo',
    response: {
      description: 'Foo information',
      schema: z.object({
        foo: api.getModelRef('Foo'),
      }),
    },
  })

  api.addOperation({
    name: 'addNested',
    description: 'Post a nested',
    method: 'post',
    path: '/nested/{id}',
    parameters: {
      id: {
        in: 'path',
        type: 'string',
        description: 'Nested id',
      },
    },
    requestBody: {
      description: 'Nested information',
      schema: nestedSchema,
    },
    section: 'nested',
    response: {
      description: 'The nested object that was created',
      schema: z.object({
        nested: api.getModelRef('Nested'),
      }),
    },
  })

  api.addOperation({
    name: 'postBar',
    description: 'Post a bar',
    method: 'post',
    path: '/bars',
    requestBody: {
      description: 'Bar information',
      schema: z.object({
        test: z.string(),
      }),
    },
    section: 'bar',
    response: {
      description: 'Bar information',
      schema: z.object({
        bar: api.getModelRef('Bar'),
      }),
    },
  })

  api.addOperation({
    name: 'listBars',
    description: 'list bars',
    method: 'get',
    path: '/bars',
    parameters: {
      enabled: {
        type: 'boolean',
        in: 'query',
        description: 'Enabled',
      },
      limit: {
        type: 'integer',
        in: 'query',
        description: 'Limit',
      },
      minimumScore: {
        type: 'number',
        in: 'query',
        description: 'Minimum score',
      },
    },
    section: 'bar',
    response: {
      description: 'Bar information',
      schema: z.object({
        bar: api.getModelRef('Bar'),
      }),
    },
  })

  return api
}
