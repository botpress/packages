import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import * as sdk from '@botpress/sdk'
import { dereference } from '@apidevtools/json-schema-ref-parser'
import type { McpServerInfo } from './schemas.js'

const dereferenceSchema = async (schema: sdk.JSONSchema7): Promise<sdk.JSONSchema7> => {
  return dereference(schema, {
    resolve: {
      external: false,
      file: false,
      http: false
    }
  })
}

const jsonSchemaToTypescriptZuiSchema = async (schema: sdk.JSONSchema7): Promise<string> => {
  schema = await dereferenceSchema(schema)
  const zuiSchema = sdk.transforms.fromJSONSchemaLegacy(schema)

  let tsSchema = zuiSchema.toTypescriptSchema()

  // Clean up date defaults - static dates don't make sense
  // z.default(z.date(), "2026-02-10T...") → z.string().datetime().optional()
  tsSchema = tsSchema.replace(
    /z\s*\.\s*default\(\s*((?:(?!\bz\s*\.\s*default\b)[\s\S])+?)\s*,\s*["']\d{4}-\d{2}-\d{2}T[\d\-T:.Z]+["']\s*\)/g,
    (match, schema) => {
      if (schema.includes('.date()') || schema.includes('.coerce.date()')) {
        return `${schema.trim().replace(/z\s*\.\s*(?:coerce\s*\.\s*)?date\(\)/, 'z.string().datetime()')}.optional()`
      }
      return match
    }
  )

  return tsSchema
}

export const generateToolDefinitionFile = async (tool: Tool): Promise<string> => {
  const inputSchema = await jsonSchemaToTypescriptZuiSchema(tool.inputSchema)
  const rawDescription = tool.description || ''
  const description = rawDescription.length > 256 ? rawDescription.substring(0, 253) + '...' : rawDescription

  return `import { z } from '@botpress/sdk'

export const ${sanitizeName(tool.name)} = {
  title: '${tool.name}',
  description: \`${description.replace(/`/g, '\\`')}\`,
  input: {
    schema: ${inputSchema}
  },
  output: {
    schema: z.object({
      content: z.array(z.any()),
      isError: z.boolean()
    })
  }
} as const
`
}

export const generateToolDefinitionsIndex = (tools: Tool[]): string => {
  const imports = tools.map((tool) => `import { ${sanitizeName(tool.name)} } from './${tool.name}.js'`).join('\n')
  const actionEntries = tools.map((tool) => `  ${sanitizeName(tool.name)}`).join(',\n')

  return `${imports}

export const actions = {
${actionEntries}
}
`
}

export const generateMcpProxy = (): string => {
  return `import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { secrets, TIntegration } from '.botpress'

export async function callMcpTool(params: {
  toolName: string
  input: Record<string, unknown>
  ctx: any
  logger: any
}): Promise<{ content: any[]; isError: boolean }> {
  const { toolName, input, ctx, logger } = params

  const mcpServerUrl = ctx.configuration.mcpServerUrl || secrets.MCP_SERVER_URL
  if (!mcpServerUrl) {
    throw new Error('MCP server URL not configured')
  }

  const transportType = ctx.configuration.transportType || 'http'
  const headers: Record<string, string> = {}

  if (ctx.configuration.authToken) {
    headers['Authorization'] = \`Bearer \${ctx.configuration.authToken}\`
  }

  if (ctx.configuration.customHeaders) {
    try {
      const customHeaders = JSON.parse(ctx.configuration.customHeaders)
      Object.assign(headers, customHeaders)
    } catch (error) {
      logger.forBot().warn('Failed to parse custom headers:', error)
    }
  }

  const url = new URL(mcpServerUrl)
  const requestInit = { headers }
  const transport =
    transportType === 'sse'
      ? new SSEClientTransport(url, { requestInit })
      : new StreamableHTTPClientTransport(url, { requestInit })

  const client = new Client(
    { name: 'botpress-integration', version: '1.0.0' },
    { capabilities: {} }
  )

  try {
    await client.connect(transport)

    const result = await client.callTool({
      name: toolName,
      arguments: input
    })

    logger.forBot().info(\`Tool \${toolName} executed successfully\`)

    const content = 'content' in result ? result.content : [] as any
    const isError = typeof result.isError === 'boolean' ? result.isError : false

    return {
      content,
      isError
    }
  } catch (error) {
    logger.forBot().error(\`Error calling tool \${toolName}:\`, error)
    throw error
  } finally {
    await client.close()
  }
}
`
}

export const generateIntegrationDefinition = (integrationName: string, serverInfo: McpServerInfo): string => {
  return `import { IntegrationDefinition, z } from '@botpress/sdk'
import { actions } from './tool-definitions/index.js'

export default new IntegrationDefinition({
  name: '${integrationName}',
  title: '${serverInfo.name}',
  description: '${serverInfo.description || `MCP Integration for ${serverInfo.name}`}',
  version: '${serverInfo.version}',
  readme: 'hub.md',
  icon: 'icon.svg',
  configuration: {
    schema: z.object({
      mcpServerUrl: z.string().title('MCP Server URL').describe(\`The URL of the MCP server (default is ${serverInfo.url}). Can be pre-filled via the MCP_SERVER_URL secret.\`),
      transportType: z.enum(['http', 'sse']).title('Transport Type').default('http').optional().describe('MCP transport type: http (default) or sse'),
      authToken: z.string().title('Authorization Token').optional().describe('Authentication token (will be sent as "Bearer <token>")'),
      customHeaders: z.string().title('Custom Headers (JSON)').optional().describe('Additional headers as JSON object (e.g., {"X-Custom": "value"})')
    })
  },
  secrets: {
    MCP_SERVER_URL: {
      description: 'Default MCP server URL. Can be overridden in configuration. Used to auto-fill the mcpServerUrl field when installing the integration.'
    }
  },
  actions
})
`
}

export const generateActions = (tools: Tool[]): string => {
  const actionProxies = tools
    .map((tool) => {
      const sanitizedName = sanitizeName(tool.name)
      return `  ${sanitizedName}: async ({ input, ctx, logger }) => {
    return callMcpTool({ toolName: '${tool.name}', input, ctx, logger })
  }`
    })
    .join(',\n')

  return `import { callMcpTool } from './mcp-proxy.js'

export const actions = {
${actionProxies}
}
`
}

export const generateIntegrationIndex = (): string => {
  return `import * as bp from '.botpress/index.js'
import { actions } from './actions.js'

export default new bp.Integration({
  register: async ({ ctx, logger }) => {
    logger.forBot().info('MCP Integration registered')
  },
  unregister: async () => {},
  actions,
  channels: {},
  handler: async () => {}
})
`
}

export const generateReadme = (serverInfo: { name: string; description?: string }, tools: Tool[]): string => {
  const toolsList = tools.map((tool) => `- **${tool.name}**: ${tool.description || 'No description'}`).join('\n')

  return `# ${serverInfo.name} Integration

${serverInfo.description || ''}

## Available Tools

${toolsList}

## Configuration

- **MCP Server URL**: The URL of the MCP server
- **Auth Token** (optional): Authentication token if required by the server

## Usage

This integration provides access to all tools exposed by the ${serverInfo.name} MCP server. Each tool is available as a separate action in Botpress.
`
}

export const generateIcon = (): string => {
  return `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background circle -->
  <circle cx="32" cy="32" r="30" fill="#6366f1"/>

  <!-- MCP Connection symbol: Two nodes connected -->
  <g>
    <!-- Left node -->
    <circle cx="20" cy="32" r="6" fill="white" opacity="0.9"/>

    <!-- Right node -->
    <circle cx="44" cy="32" r="6" fill="white" opacity="0.9"/>

    <!-- Connection line -->
    <line x1="26" y1="32" x2="38" y2="32" stroke="white" stroke-width="2.5" opacity="0.9"/>

    <!-- Data flow arrows -->
    <path d="M 30 32 L 34 29 L 34 35 Z" fill="white" opacity="0.9"/>
  </g>

  <!-- MCP label -->
  <text x="32" y="52" font-family="system-ui, sans-serif" font-size="8" font-weight="600" fill="white" text-anchor="middle" opacity="0.8">MCP</text>
</svg>`
}

function sanitizeName(name: string): string {
  // Convert any format to proper camelCase
  // Handles: kebab-case, snake_case, PascalCase, acronyms

  // Step 1: Split on common separators and capital letters
  const parts = name
    // Replace special chars with spaces
    .replace(/[^a-zA-Z0-9]/g, ' ')
    // Split on transitions from lowercase to uppercase (camelCase/PascalCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Split on transitions from letters to numbers
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Split on transitions from multiple uppercase to lowercase (acronyms)
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    // Split into words
    .split(/\s+/)
    .filter(Boolean)

  // Step 2: Convert to camelCase
  return parts
    .map((part, index) => {
      // Lowercase the entire part first
      const lower = part.toLowerCase()

      // First part stays lowercase, others get capitalized
      if (index === 0) {
        return lower
      }

      // Capitalize first letter of subsequent parts
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join('')
}
