import { describe, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

describe('api types generator', () => {
  it('should be able to generate valid typescript files for section wise types', async () => {
    const genClientFolder = join(__dirname, 'gen/api-types')

    const api = getMockApi()

    await api.exportTypesBySection(genClientFolder)

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
