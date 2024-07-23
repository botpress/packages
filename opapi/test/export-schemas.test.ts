import { describe, expect, it } from 'vitest'
import { join } from 'path'
import { existsSync } from 'fs'
import { exportSchemas } from '../src'
import { validateTypescriptFile } from './util'
import { getFiles } from '../src/file'

const schemaFiles = ['index.ts', 'user.j.ts', 'user.z.ts', 'user.t.ts', 'ticket.j.ts', 'ticket.z.ts', 'ticket.t.ts']

describe('schemas generator', () => {
  it('should be able to generate arbitrary loose schemas', async () => {
    const genFolder = join(__dirname, 'gen/schemas')

    const exporter = exportSchemas({
      user: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      },
      ticket: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
        },
        required: ['title'],
      },
    })

    await exporter(genFolder)

    schemaFiles.forEach((file) => {
      const filename = join(genFolder, file)
      expect(existsSync(filename), `${filename} should exist`).toBe(true)

      if (filename.endsWith('.ts')) {
        validateTypescriptFile(filename)
      }
    })

    const files = getFiles(genFolder)
    expect(files.length).toBe(schemaFiles.length)
  })
})
