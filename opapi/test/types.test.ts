import { describe, it } from 'vitest'
import { createApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

describe('types generator', () => {
  it('should be able to generate a client', async () => {
    const genClientFolder = join(__dirname, 'gen/api-types')

    const api = createApi()

    await api.exportTypes(genClientFolder)

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
