import { describe, it, expect } from 'vitest'
import { OpenApi, OpenApiProps } from '../src'
import { z } from 'zod'
import { applyExportOptions } from '../src/export-options'

type AnyProps = OpenApiProps<string, string, string>

function getApi() {
  const metadata = {
    title: 'Test API',
    description: 'Test API',
    server: 'http://localhost:3000',
    version: '1.0.0',
    prefix: '/v1',
  } satisfies AnyProps['metadata']

  const sections = {
    trees: {
      title: 'Trees',
      description: 'Trees section',
    },
  } satisfies AnyProps['sections']

  const leaf: z.ZodType = z.object({
    type: z.literal('leaf'),
    name: z.string(),
    data: z.string(),
  })
  const node: z.ZodType = z.object({
    type: z.literal('node'),
    name: z.string(),
    children: z.array(z.lazy(() => tree)),
  })
  const tree: z.ZodType = z.union([leaf, node])

  const api = OpenApi(
    {
      metadata,
      sections,
      defaultParameters: {
        'x-tree': {
          description: 'Tree id',
          in: 'header',
          type: 'string',
        },
      },
      schemas: {
        Tree: {
          section: 'trees',
          schema: tree,
        },
      },
      security: ['BearerAuth'],
    },
    { allowUnions: true },
  )

  api.addOperation({
    security: ['BearerAuth'],
    name: 'getTree',
    description: 'Get a tree',
    method: 'get',
    path: '/trees/{id}',
    parameters: {
      id: {
        description: 'Tree id',
        in: 'path',
        type: 'string',
      },
    },
    response: {
      description: 'Tree information',
      schema: tree,
    },
  })

  return api
}

describe('Apply Export Options', () => {
  it('defaultParameters should be removed when ignoreDefaultParameters is true', async () => {
    const api = getApi()
    const initState = api.getState()

    expect(initState.operations['getTree'].parameters!['x-tree']).toBeDefined()
    expect(initState.operations['getTree'].parameters!['id']).toBeDefined()

    const updatedState = applyExportOptions(api.getState(), {
      ignoreDefaultParameters: true,
    })

    expect(updatedState.operations['getTree'].parameters!['x-tree']).toBeUndefined()
    expect(updatedState.operations['getTree'].parameters!['id']).toBeDefined()
  })

  it('defaultParameters should not be removed when ignoreDefaultParameters is false', async () => {
    const api = getApi()
    const initState = api.getState()

    expect(initState.operations['getTree'].parameters!['x-tree']).toBeDefined()
    expect(initState.operations['getTree'].parameters!['id']).toBeDefined()

    const updatedState = applyExportOptions(api.getState(), {
      ignoreDefaultParameters: false,
    })

    expect(updatedState.operations['getTree'].parameters!['x-tree']).toBeDefined()
    expect(updatedState.operations['getTree'].parameters!['id']).toBeDefined()
  })

  it('security should not be removed when ignoreSecurity is false', async () => {
    const api = getApi()
    const initState = api.getState()

    expect(initState.security).toBeDefined()
    expect(initState.operations['getTree'].security).toBeDefined()

    const updatedState = applyExportOptions(api.getState(), {
      ignoreSecurity: false,
    })

    expect(updatedState.security).toBeDefined()
    expect(updatedState.operations['getTree'].security).toBeDefined()
  })

  it('security should be removed when ignoreSecurity is true', async () => {
    const api = getApi()
    const initState = api.getState()

    expect(initState.security).toBeDefined()
    expect(initState.operations['getTree'].security).toBeDefined()

    const updatedState = applyExportOptions(api.getState(), {
      ignoreSecurity: true,
    })

    expect(updatedState.security).toBeUndefined()
    expect(updatedState.operations['getTree'].security).toBeUndefined()
  })
})
