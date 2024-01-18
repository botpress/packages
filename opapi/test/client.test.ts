import { describe, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/utils/file'
import { validateTypescriptFile } from './util'

describe('client generator', () => {
  it('should be able to generate a client', async () => {
    const genClientFolder = join(__dirname, 'gen/client')

    const api = getMockApi()

    await api.exportClient(genClientFolder, 'https://api.openapi-generator.tech')

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
