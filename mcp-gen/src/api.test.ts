import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateIntegration, generateIntegrationWithConfig } from './api.js'

const mockGenerate = vi.fn()
const mockLoad = vi.fn()

vi.mock('./generator.js', () => ({
  IntegrationGenerator: class {
    generate = mockGenerate
  }
}))

vi.mock('./config-manager.js', () => ({
  ConfigManager: class {
    load = mockLoad
  }
}))

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateIntegration', () => {
    it('should validate inputs and call generator', async () => {
      mockGenerate.mockResolvedValue(undefined)

      await generateIntegration({
        integrationName: 'test-integration',
        mcpServerUrl: 'http://localhost:3000',
        outputDir: './output'
      })

      expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
        integrationName: 'test-integration',
        mcpServerUrl: 'http://localhost:3000'
      }))
    })

    it('should reject invalid integration name', async () => {
      await expect(generateIntegration({
        integrationName: 'Invalid Name',
        mcpServerUrl: 'http://localhost:3000',
        outputDir: './output'
      })).rejects.toThrow()
    })

    it('should reject invalid URL', async () => {
      await expect(generateIntegration({
        integrationName: 'test',
        mcpServerUrl: 'not-a-url',
        outputDir: './output'
      })).rejects.toThrow()
    })

    it('should propagate generator errors', async () => {
      mockGenerate.mockRejectedValue(new Error('Generation failed'))

      await expect(generateIntegration({
        integrationName: 'test',
        mcpServerUrl: 'http://localhost:3000',
        outputDir: './output'
      })).rejects.toThrow('Generation failed')
    })
  })

  describe('generateIntegrationWithConfig', () => {
    it('should load config and generate with merged options', async () => {
      mockLoad.mockResolvedValue({
        name: 'saved-integration',
        url: 'http://localhost:4000',
        type: 'http' as const,
        headers: { 'X-Custom': 'value' }
      })
      mockGenerate.mockResolvedValue(undefined)

      await generateIntegrationWithConfig({ outputDir: './output' })

      expect(mockLoad).toHaveBeenCalledWith('./output')
      expect(mockGenerate).toHaveBeenCalledWith({
        integrationName: 'saved-integration',
        mcpServerUrl: 'http://localhost:4000',
        outputDir: './output',
        transport: 'http',
        headers: { 'X-Custom': 'value' },
        updateMode: false,
        saveConfig: false,
        configFilename: undefined
      })
    })

    it('should override saved config with provided options', async () => {
      mockLoad.mockResolvedValue({
        name: 'saved',
        url: 'http://localhost:4000',
        type: 'http' as const
      })
      mockGenerate.mockResolvedValue(undefined)

      await generateIntegrationWithConfig({
        outputDir: './output',
        integrationName: 'override-name',
        mcpServerUrl: 'http://localhost:5000',
        transport: 'sse'
      })

      expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
        integrationName: 'override-name',
        mcpServerUrl: 'http://localhost:5000',
        transport: 'sse'
      }))
    })

    it('should merge headers from config and options (options win)', async () => {
      mockLoad.mockResolvedValue({
        name: 'test',
        url: 'http://localhost:3000',
        type: 'http' as const,
        headers: { 'X-Saved': 'value1', 'X-Override': 'old' }
      })
      mockGenerate.mockResolvedValue(undefined)

      await generateIntegrationWithConfig({
        outputDir: './output',
        headers: { 'X-New': 'value2', 'X-Override': 'new' }
      })

      expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({
        headers: { 'X-Saved': 'value1', 'X-New': 'value2', 'X-Override': 'new' }
      }))
    })

    it('should throw when no integration name available', async () => {
      mockLoad.mockResolvedValue(null)

      await expect(generateIntegrationWithConfig({ outputDir: './output' })).rejects.toThrow('integrationName is required')
    })

    it('should throw when no mcpServerUrl available', async () => {
      mockLoad.mockResolvedValue({ name: 'test', type: 'http' as const } as any)

      await expect(generateIntegrationWithConfig({ outputDir: './output' })).rejects.toThrow('mcpServerUrl is required')
    })

    it('should fallback to http transport when config has no type', async () => {
      mockLoad.mockResolvedValue({ name: 'test', url: 'http://localhost:3000' } as any)
      mockGenerate.mockResolvedValue(undefined)

      await generateIntegrationWithConfig({ outputDir: './output' })

      expect(mockGenerate).toHaveBeenCalledWith(expect.objectContaining({ transport: 'http' }))
    })

    it('should propagate config load errors', async () => {
      mockLoad.mockRejectedValue(new Error('Load failed'))

      await expect(generateIntegrationWithConfig({
        outputDir: './output',
        integrationName: 'test',
        mcpServerUrl: 'http://localhost:3000'
      })).rejects.toThrow('Load failed')
    })
  })
})
