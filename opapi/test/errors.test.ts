import { describe, expect, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { existsSync } from 'fs'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

const errorFiles = ['errors.ts']

describe('server generator', () => {
  it('should be able to generate a server', async () => {
    const genServerFolder = join(__dirname, 'gen/errors')

    const api = getMockApi()

    api.exportErrors(genServerFolder)

    errorFiles.forEach((file) => {
      const filename = join(genServerFolder, file)
      expect(existsSync(filename), `${filename} should exist`).toBe(true)

      if (filename.endsWith('.ts')) {
        validateTypescriptFile(filename)
      }
    })

    const files = getFiles(genServerFolder)
    expect(files.length).toBe(errorFiles.length)
  })
})
