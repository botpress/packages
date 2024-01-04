import { describe, expect, it } from 'vitest'
import z from 'zod'
import { OpenApi, OpenApiProps } from '../src'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

type AnyProps = OpenApiProps<string, string, string>

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

// TODO: actually declare a bunch of opapi errors instead of this hard-coded message
const expectedErrorMessage = 'allOf, anyOf and oneOf are not supported'

describe('openapi generator with unions not allowed', () => {
  it('should not allow unions when creating api', async () => {
    expect(() => {
      OpenApi({
        metadata,
        sections,
        schemas: {
          Tree: {
            section: 'trees',
            schema: tree,
          },
        },
      })
    }).toThrowError(expectedErrorMessage)
  })

  it('should not allow unions in response when adding an operation', async () => {
    const api = OpenApi({ metadata, sections })
    expect(() => {
      api.addOperation({
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
    }).toThrowError(expectedErrorMessage)
  })

  it('should not allow unions in request body when adding an operation', async () => {
    const api = OpenApi({ metadata, sections })
    expect(() => {
      api.addOperation({
        name: 'createTree',
        description: 'Create a tree',
        method: 'post',
        path: '/trees',
        requestBody: {
          description: 'Tree information',
          schema: tree,
        },
        response: {
          description: 'Tree information',
          schema: z.object({}),
        },
      })
    }).toThrowError(expectedErrorMessage)
  })
})

describe('openapi generator with unions allowed', () => {
  const opts = { allowUnions: true } as const
  it('should allow unions when creating api', async () => {
    OpenApi(
      {
        metadata,
        sections,
        schemas: {
          Tree: {
            section: 'trees',
            schema: tree,
          },
        },
      },
      opts,
    )
  })

  it('should allow unions in response when adding an operation', async () => {
    const api = OpenApi({ metadata, sections }, opts)
    api.addOperation({
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
  })

  it('should allow unions in request body when adding an operation', async () => {
    const api = OpenApi({ metadata, sections }, opts)
    api.addOperation({
      name: 'createTree',
      description: 'Create a tree',
      method: 'post',
      path: '/trees',
      requestBody: {
        description: 'Tree information',
        schema: tree,
      },
      response: {
        description: 'Tree information',
        schema: z.object({}),
      },
    })
  })
})

describe('openapi state generator', () => {
  it('should export state', async () => {
    const api = OpenApi(
      {
        metadata,
        sections,
        schemas: {
          Tree: {
            section: 'trees',
            schema: tree,
          },
        },
      },
      { allowUnions: true },
    )

    const genStateFolder = join(__dirname, 'gen/state')
    api.exportState(genStateFolder, { importPath: '../../../src' })

    const files = getFiles(genStateFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
