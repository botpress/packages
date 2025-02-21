import { afterEach, describe, expect, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { existsSync, rmdirSync } from 'fs'
import { getFiles } from '../src/file'
import { getTypescriptErrors, validateTypescriptFile } from './util'
import { z } from 'zod'

const serverFiles = [
  'definition.ts',
  'handlers.ts',
  'schema.ts',
  'type.ts',
  'metadata.json',
  'openapi.json',
  'errors.ts',
]

const GEN_DIR = join(__dirname, 'gen/server')

describe('server generator', () => {
  afterEach(() => {
    const genServerFolder = GEN_DIR
    rmdirSync(genServerFolder, { recursive: true })
  })

  it('should be able to generate a server', async () => {
    const genServerFolder = GEN_DIR

    const api = getMockApi()

    await api.exportServer(genServerFolder, true)

    serverFiles.forEach((file) => {
      const filename = join(genServerFolder, file)
      expect(existsSync(filename), `${filename} should exist`).toBe(true)

      if (filename.endsWith('.ts')) {
        validateTypescriptFile(filename)
      }
    })

    const files = getFiles(genServerFolder)
    expect(files.length).toBe(serverFiles.length)
  })

  it('should correctly handle empty request body', async () => {
    const genServerFolder = GEN_DIR

    const api = getMockApi()

    api.addOperation({
      name: 'postBaz',
      description: 'Post a baz',
      method: 'post',
      path: '/baz/{id}',
      requestBody: { schema: z.object({}), description: 'Baz information' },
      response: { schema: z.object({ baz: z.object({ id: z.string() }) }), description: 'Baz information' },
      parameters: {
        id: {
          in: 'path',
          description: 'Baz id',
          type: 'string',
        },
      },
    })

    await api.exportServer(genServerFolder, true)

    for (const file of serverFiles) {
      const filename = join(genServerFolder, file)
      expect(existsSync(filename), `${filename} should exist`).toBe(true)

      const errors = getTypescriptErrors(filename)
      expect(errors, `${filename} should contain no typescript errors`).toEqual([])
    }

    const files = getFiles(genServerFolder)
    expect(files.length).toBe(serverFiles.length)
  })
})
