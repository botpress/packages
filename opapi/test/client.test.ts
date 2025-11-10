import { describe, expect, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { validateTypescriptFile } from './util'
import fs from 'node:fs'

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

  it('should not include defaultParameters when ignoreDefaultParameters: true', async () => {
    const genClientFolder = join(__dirname, 'gen/client-opapi-no-default')

    const api = getMockApi()

    await api.exportClient(genClientFolder, {
      generator: 'opapi',
      ignoreDefaultParameters: true,
    })

    const files = getFiles(genClientFolder)

    files.forEach((file) => {
      if (file.endsWith('.ts')) {
        validateTypescriptFile(file)
      }
    })
    await Promise.all(
      files
        .filter((file) => file.includes('operations'))
        .map(async (file) => {
          const content = fs.readFileSync(file, { encoding: 'utf8' })
          if (content.includes('xFoo')) {
            throw new Error(`'xFoo' parameter should not be included in ${file}`)
          }
        }),
    )
  })
})
