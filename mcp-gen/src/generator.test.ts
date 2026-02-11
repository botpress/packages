import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IntegrationGenerator } from './generator.js'
import * as fs from 'fs/promises'

const mockConnect = vi.fn()
const mockGetServerInfo = vi.fn()
const mockClose = vi.fn()
const mockSave = vi.fn()
const mockCreateConfig = vi.fn()

vi.mock('./mcp-client.js', () => ({
  McpClient: class {
    connect = mockConnect
    getServerInfo = mockGetServerInfo
    close = mockClose
  }
}))

vi.mock('./config-manager.js', () => ({
  ConfigManager: class {
    save = mockSave
    createConfig = mockCreateConfig
  }
}))

vi.mock('fs/promises')
vi.mock('./utils.js', () => ({
  writeFormattedFile: vi.fn(),
  getLatestNpmVersion: vi.fn((pkg, fallback) => Promise.resolve(fallback))
}))

vi.mock('./templates.js', () => ({
  generateToolDefinitionFile: vi.fn((tool) => Promise.resolve(`// Tool: ${tool.name}`)),
  generateToolDefinitionsIndex: vi.fn(() => 'export {}'),
  generateMcpProxy: vi.fn(() => '// MCP Proxy'),
  generateActions: vi.fn(() => '// Actions'),
  generateIntegrationDefinition: vi.fn(() => '// Integration Definition'),
  generateIntegrationIndex: vi.fn(() => '// Integration Index'),
  generateReadme: vi.fn(() => '# README'),
  generateIcon: vi.fn(() => '<svg></svg>')
}))

describe('IntegrationGenerator', () => {
  let generator: IntegrationGenerator

  const mockServerInfo = {
    name: 'Test Server',
    version: '1.0.0',
    description: 'A test server',
    tools: [
      { name: 'tool1', description: 'First tool', inputSchema: { type: 'object' } },
      { name: 'tool2', description: 'Second tool', inputSchema: { type: 'object' } }
    ],
    url: 'http://localhost:3000'
  }

  beforeEach(() => {
    generator = new IntegrationGenerator()
    vi.clearAllMocks()
    mockConnect.mockResolvedValue(undefined)
    mockGetServerInfo.mockResolvedValue(mockServerInfo)
    mockClose.mockResolvedValue(undefined)
    vi.mocked(fs.mkdir).mockResolvedValue(undefined)
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should connect, fetch server info, generate files, and close', async () => {
    await generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output'
    })

    expect(mockConnect).toHaveBeenCalledWith('http://localhost:3000', 'http', {})
    expect(mockGetServerInfo).toHaveBeenCalled()
    expect(mockClose).toHaveBeenCalled()
  })

  it('should use specified transport and headers', async () => {
    const headers = { Authorization: 'Bearer token' }

    await generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output',
      transport: 'sse',
      headers
    })

    expect(mockConnect).toHaveBeenCalledWith('http://localhost:3000', 'sse', headers)
  })

  it('should create output directories', async () => {
    await generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output'
    })

    expect(fs.mkdir).toHaveBeenCalledWith('./output', { recursive: true })
    expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('src'), { recursive: true })
    expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('tool-definitions'), { recursive: true })
  })

  it('should save config when saveConfig is true', async () => {
    const config = { name: 'test', url: 'http://localhost:3000', type: 'http' as const }
    mockCreateConfig.mockReturnValue(config)

    await generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output',
      saveConfig: true
    })

    expect(mockCreateConfig).toHaveBeenCalledWith('test-integration', 'http://localhost:3000', 'http', undefined)
    expect(mockSave).toHaveBeenCalledWith('./output', config)
  })

  it('should propagate connection errors', async () => {
    mockConnect.mockRejectedValue(new Error('Connection failed'))

    await expect(generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output'
    })).rejects.toThrow('Connection failed')
  })

  it('should propagate server info fetch errors', async () => {
    mockGetServerInfo.mockRejectedValue(new Error('Failed to fetch'))

    await expect(generator.generate({
      integrationName: 'test-integration',
      mcpServerUrl: 'http://localhost:3000',
      outputDir: './output'
    })).rejects.toThrow('Failed to fetch')
  })
})
