import { describe, expect, it } from 'vitest'
import { getMockApi } from './api'
import { join } from 'path'
import { getFiles } from '../src/file'
import { existsSync } from 'fs'

const openapiFiles = ['metadata.json', 'openapi.json']

describe('openapi generator', () => {
  it('should be able to generate a openapi', async () => {
    const genOpenapiFolder = join(__dirname, 'gen/openapi')

    const api = getMockApi()

    api.exportOpenapi(genOpenapiFolder)

    openapiFiles.forEach((file) => {
      const filename = join(genOpenapiFolder, file)
      expect(existsSync(filename), `${filename} should exist`).toBe(true)
    })

    const files = getFiles(genOpenapiFolder)
    expect(files.length).toBe(openapiFiles.length)
  })
})
