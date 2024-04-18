import { describe, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'

describe('client generator', () => {
  it('should be able to generate a client with openapi-generator', async () => {
    const genClientFolder = join(__dirname, 'gen/client-openapi-generator')

    const api = getMockApi()

    await api.exportClient(genClientFolder, 'https://api.openapi-generator.tech')

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })

  it('should be able to generate a client with opapi', async () => {
    const genClientFolder = join(__dirname, 'gen/client-opapi')

    const api = getMockApi()

    await api.exportClient(genClientFolder, {
      generator: 'opapi',
    })

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
  })
})
