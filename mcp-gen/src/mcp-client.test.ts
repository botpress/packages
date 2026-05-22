import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { McpClient } from './mcp-client.js'

const mockConnect = vi.fn()
const mockGetServerVersion = vi.fn()
const mockListTools = vi.fn()
const mockClose = vi.fn()

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: class {
    connect = mockConnect
    getServerVersion = mockGetServerVersion
    listTools = mockListTools
    close = mockClose
  }
}))

vi.mock('@modelcontextprotocol/sdk/client/sse.js', () => ({
  SSEClientTransport: class {}
}))

vi.mock('@modelcontextprotocol/sdk/client/streamableHttp.js', () => ({
  StreamableHTTPClientTransport: class {}
}))

describe('McpClient', () => {
  let client: McpClient

  beforeEach(() => {
    client = new McpClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('connect', () => {
    it('should connect successfully', async () => {
      mockConnect.mockResolvedValue(undefined)
      await client.connect('http://localhost:3000', 'http')
      expect(mockConnect).toHaveBeenCalled()
    })

    it('should reject invalid URLs', async () => {
      await expect(client.connect('not-a-url', 'http')).rejects.toThrow()
    })

    it('should reject invalid transport type', async () => {
      await expect(client.connect('http://localhost:3000', 'websocket' as any)).rejects.toThrow('Invalid transport type')
    })

    it('should timeout and cleanup after specified duration', async () => {
      mockConnect.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      await expect(client.connect('http://localhost:3000', 'http', {}, 50)).rejects.toThrow('Connection timeout after 50ms')
      expect(mockClose).toHaveBeenCalled()
    })

    it('should map ECONNREFUSED to friendly error', async () => {
      mockConnect.mockRejectedValue(new Error('connect ECONNREFUSED'))

      await expect(client.connect('http://localhost:3000', 'http')).rejects.toThrow(
        'Cannot connect to MCP server at http://localhost:3000'
      )
      expect(mockClose).toHaveBeenCalled()
    })

    it('should map ENOTFOUND to hostname error', async () => {
      mockConnect.mockRejectedValue(new Error('getaddrinfo ENOTFOUND'))

      await expect(client.connect('http://invalid-host.example', 'http')).rejects.toThrow(
        'Cannot resolve hostname: invalid-host.example'
      )
    })

    it('should handle errors during cleanup gracefully', async () => {
      mockConnect.mockRejectedValue(new Error('Connection failed'))
      mockClose.mockRejectedValue(new Error('Close failed'))
      vi.spyOn(console, 'warn').mockImplementation(() => {})

      await expect(client.connect('http://localhost:3000', 'http')).rejects.toThrow('Connection failed')
    })
  })

  describe('getServerInfo', () => {
    beforeEach(async () => {
      mockConnect.mockResolvedValue(undefined)
      await client.connect('http://localhost:3000', 'http')
      vi.clearAllMocks()
    })

    it('should return server info and tools', async () => {
      mockGetServerVersion.mockResolvedValue({ name: 'Test Server', version: '1.0.0', description: 'A test server' })
      mockListTools.mockResolvedValue({ tools: [{ name: 'tool1', inputSchema: {} }] })

      const result = await client.getServerInfo()

      expect(result).toEqual({
        name: 'Test Server',
        version: '1.0.0',
        description: 'A test server',
        tools: [{ name: 'tool1', inputSchema: {} }],
        url: 'http://localhost:3000'
      })
    })

    it('should default version to 0.0.0 when not provided', async () => {
      mockGetServerVersion.mockResolvedValue({ name: 'Test Server' })
      mockListTools.mockResolvedValue({ tools: [] })

      expect((await client.getServerInfo()).version).toBe('0.0.0')
    })

    it('should throw when client is not connected', async () => {
      await expect(new McpClient().getServerInfo()).rejects.toThrow('Client not connected')
    })

    it('should throw for null server info or empty name', async () => {
      mockGetServerVersion.mockResolvedValue(null)
      mockListTools.mockResolvedValue({ tools: [] })
      await expect(client.getServerInfo()).rejects.toThrow('null server info')

      mockGetServerVersion.mockResolvedValue({ name: '   ' })
      await expect(client.getServerInfo()).rejects.toThrow('invalid server name')
    })

    it('should throw for missing tools response', async () => {
      mockGetServerVersion.mockResolvedValue({ name: 'Test Server' })
      mockListTools.mockResolvedValue({})
      await expect(client.getServerInfo()).rejects.toThrow('invalid tools response')
    })

    it('should wrap API errors with context', async () => {
      mockGetServerVersion.mockRejectedValue(new Error('API request failed'))
      await expect(client.getServerInfo()).rejects.toThrow('Failed to fetch server info: API request failed')
    })
  })

  describe('close', () => {
    it('should close the client and prevent reuse', async () => {
      mockConnect.mockResolvedValue(undefined)
      mockClose.mockResolvedValue(undefined)

      await client.connect('http://localhost:3000', 'http')
      await client.close()

      expect(mockClose).toHaveBeenCalled()
      await expect(client.getServerInfo()).rejects.toThrow('Client not connected')
    })

    it('should be safe to call when not connected', async () => {
      await expect(client.close()).resolves.not.toThrow()
    })

    it('should prevent double close', async () => {
      mockConnect.mockResolvedValue(undefined)
      mockClose.mockResolvedValue(undefined)

      await client.connect('http://localhost:3000', 'http')
      await client.close()
      vi.clearAllMocks()
      await client.close()

      expect(mockClose).not.toHaveBeenCalled()
    })
  })
})
