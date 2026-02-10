import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import { EventSource as EventSourcePolyfill } from 'eventsource'
import { validateUrl, sanitizeHeaders } from './validators.js'

if (typeof globalThis.EventSource === 'undefined') {
  ;(globalThis as any).EventSource = EventSourcePolyfill
}

export type TransportType = 'http' | 'sse'

export interface McpServerInfo {
  name: string
  version: string
  description?: string
  tools: Tool[]
}

export class McpClient {
  private client: Client | null = null

  async connect(
    serverUrl: string,
    transportType: TransportType = 'http',
    headers?: Record<string, string>,
    timeoutMs: number = 30000
  ): Promise<void> {
    validateUrl(serverUrl)

    const url = new URL(serverUrl)

    if (transportType !== 'http' && transportType !== 'sse') {
      throw new Error(`Invalid transport type: ${transportType}`)
    }

    const cleanHeaders = headers ? sanitizeHeaders(headers) : {}
    const requestInit = { headers: cleanHeaders }

    const transport =
      transportType === 'sse'
        ? new SSEClientTransport(url, { requestInit })
        : new StreamableHTTPClientTransport(url, { requestInit })

    this.client = new Client(
      {
        name: 'mcp-gen',
        version: '0.1.0'
      },
      {
        capabilities: {}
      }
    )

    const connectPromise = this.client.connect(transport)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
    })

    try {
      await Promise.race([connectPromise, timeoutPromise])
    } catch (error) {
      await this.cleanup()

      if (error instanceof Error) {
        if (error.message.includes('ECONNREFUSED')) {
          throw new Error(`Cannot connect to MCP server at ${serverUrl}. Ensure the server is running.`)
        }
        if (error.message.includes('ENOTFOUND')) {
          throw new Error(`Cannot resolve hostname: ${url.hostname}`)
        }
      }
      throw error
    }
  }

  async getServerInfo(): Promise<McpServerInfo> {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.')
    }

    let serverInfo: Awaited<ReturnType<typeof this.client.getServerVersion>>
    let toolsResponse: Awaited<ReturnType<typeof this.client.listTools>>

    try {
      ;[serverInfo, toolsResponse] = await Promise.all([this.client.getServerVersion(), this.client.listTools()])
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch server info: ${error.message}`)
      }
      throw error
    }

    if (!serverInfo) {
      throw new Error('MCP server returned null server info')
    }

    if (!serverInfo.name?.trim()) {
      throw new Error('MCP server returned invalid server name')
    }

    if (!toolsResponse?.tools) {
      throw new Error('MCP server returned invalid tools response')
    }

    return {
      name: serverInfo.name,
      version: serverInfo.version || '0.0.0',
      description: serverInfo.description,
      tools: toolsResponse.tools
    }
  }

  async close(): Promise<void> {
    await this.cleanup()
  }

  private async cleanup(): Promise<void> {
    if (this.client) {
      const clientToClose = this.client
      this.client = null

      try {
        await clientToClose.close()
      } catch (error) {
        console.warn('Warning: Error closing MCP client:', error)
      }
    }
  }
}
