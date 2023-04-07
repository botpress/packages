import { describe, it } from 'vitest'
import { createApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

describe('client generator', () => {
  it('should be able to generate a client', async () => {
    const genClientFolder = join(__dirname, 'gen/client')

    const api = createApi()

    await api.exportClient(genClientFolder, 'https://api.openapi-generator.tech')

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
