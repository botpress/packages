import { z } from 'zod'
import { OpenApi, schema } from '../src'

const fooSchema = z.object({
  id: z.string(),
  name: z.string(),
})

export const createApi = () => {
  const api = OpenApi({
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
    },
    schemas: {
      Foo: {
        section: 'foo',
        schema: fooSchema,
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
      schema: schema(z.object({}), { description: 'Foo information' }),
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

  return api
}
