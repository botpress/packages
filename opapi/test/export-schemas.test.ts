import { describe, expect, it } from 'vitest'
import { join } from 'path'
import { existsSync } from 'fs'
import { exportJsonSchemas, exportZodSchemas } from '../src'
import { validateTypescriptFile } from './util'
import { getFiles } from '../src/file'
import { z } from 'zod'

const schemaFiles = ['index.ts', 'user.j.ts', 'user.z.ts', 'user.t.ts', 'ticket.j.ts', 'ticket.z.ts', 'ticket.t.ts']

const assert = async (genFolder: string, exporter: (outDir: string) => Promise<void>) => {
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
}

describe('schemas generator', () => {
  it('should be able to export arbitrary json schemas', async () => {
    const genFolder = join(__dirname, 'gen/json-schemas')
    await assert(
      genFolder,
      exportJsonSchemas({
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
      }),
    )
  })

  it('should be able to export arbitrary zod schemas', async () => {
    const genFolder = join(__dirname, 'gen/zod-schemas')
    await assert(
      genFolder,
      exportZodSchemas({
        user: z.object({
          name: z.string(),
          age: z.number().optional(),
        }),
        ticket: z.object({
          title: z.string(),
          content: z.string().optional(),
        }),
      }),
    )
  })
})
