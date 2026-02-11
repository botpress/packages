import { describe, it, expect, vi } from 'vitest'
import {
  generateToolDefinitionFile,
  generateToolDefinitionsIndex,
  generateIntegrationDefinition,
  generateIntegrationIndex,
  generateReadme
} from './templates.js'

vi.mock('@apidevtools/json-schema-ref-parser', () => ({
  dereference: vi.fn((schema) => Promise.resolve(schema))
}))

vi.mock('@botpress/sdk', () => ({
  transforms: {
    fromJSONSchemaLegacy: vi.fn(() => ({
      toTypescriptSchema: () => 'z.object({ test: z.string() })'
    }))
  }
}))

describe('templates', () => {
  describe('generateToolDefinitionFile', () => {
    it('should generate definition with sanitized name, description, and schemas', async () => {
      const result = await generateToolDefinitionFile({
        name: 'test-tool',
        description: 'A test tool',
        inputSchema: { type: 'object', properties: { input: { type: 'string' } } }
      })

      expect(result).toContain('export const testTool = {')
      expect(result).toContain("title: 'test-tool'")
      expect(result).toContain('description: `A test tool`')
      expect(result).toContain('content: z.array(z.any())')
      expect(result).toContain('isError: z.boolean()')
    })

    it('should truncate descriptions longer than 256 characters', async () => {
      const result = await generateToolDefinitionFile({
        name: 'test-tool',
        description: 'A'.repeat(300),
        inputSchema: { type: 'object', properties: {} }
      })

      expect(result).toContain('A'.repeat(253) + '...')
    })

    it('should escape backticks in descriptions', async () => {
      const result = await generateToolDefinitionFile({
        name: 'test-tool',
        description: 'Use `code` here',
        inputSchema: { type: 'object', properties: {} }
      })

      expect(result).toContain('Use \\`code\\` here')
    })
  })

  describe('generateToolDefinitionsIndex', () => {
    it('should export all tools with sanitized names', () => {
      const result = generateToolDefinitionsIndex([
        { name: 'tool-one', inputSchema: { type: 'object' } },
        { name: 'tool_two', inputSchema: { type: 'object' } }
      ])

      expect(result).toContain("export { toolOne } from './tool-one.js'")
      expect(result).toContain("export { toolTwo } from './tool_two.js'")
    })
  })

  describe('generateIntegrationDefinition', () => {
    it('should include metadata and list tools as actions', () => {
      const result = generateIntegrationDefinition('test-integration', {
        name: 'Test Server',
        version: '1.0.0',
        description: 'A test server',
        tools: [
          { name: 'tool-one', inputSchema: { type: 'object' } },
          { name: 'tool-two', inputSchema: { type: 'object' } }
        ],
        url: 'http://localhost:3000'
      })

      expect(result).toContain("name: 'test-integration'")
      expect(result).toContain("title: 'Test Server'")
      expect(result).toContain("import { toolOne, toolTwo } from './tool-definitions/index.js'")
      expect(result).toContain('actions: {')
    })

    it('should use default description when not provided', () => {
      const result = generateIntegrationDefinition('test', {
        name: 'Test Server',
        version: '1.0.0',
        tools: [],
        url: 'http://localhost:3000'
      })

      expect(result).toContain('MCP Integration for Test Server')
    })
  })

  describe('generateIntegrationIndex', () => {
    it('should generate action proxies for all tools', () => {
      const result = generateIntegrationIndex([
        { name: 'tool-one', inputSchema: { type: 'object' } },
        { name: 'tool-two', inputSchema: { type: 'object' } }
      ])

      expect(result).toContain('toolOne: async ({ input, ctx, logger }) => {')
      expect(result).toContain("return callMcpTool({ toolName: 'tool-one'")
      expect(result).toContain("return callMcpTool({ toolName: 'tool-two'")
    })
  })

  describe('generateReadme', () => {
    it('should include server info and tool descriptions', () => {
      const result = generateReadme({ name: 'Test Server', description: 'A test server' }, [
        { name: 'tool-one', description: 'First tool', inputSchema: { type: 'object' } },
        { name: 'tool-two', inputSchema: { type: 'object' } }
      ])

      expect(result).toContain('# Test Server Integration')
      expect(result).toContain('A test server')
      expect(result).toContain('- **tool-one**: First tool')
      expect(result).toContain('- **tool-two**: No description')
    })
  })

  describe('sanitizeName (via generateToolDefinitionFile)', () => {
    const expectSanitized = async (name: string, expected: string) => {
      const result = await generateToolDefinitionFile({ name, inputSchema: { type: 'object' } })
      expect(result).toContain(`export const ${expected}`)
    }

    it('should convert kebab-case', async () => await expectSanitized('my-test-tool', 'myTestTool'))
    it('should convert snake_case', async () => await expectSanitized('my_test_tool', 'myTestTool'))
    it('should convert PascalCase', async () => await expectSanitized('MyTestTool', 'myTestTool'))
    it('should handle acronyms', async () => await expectSanitized('HTTPSConnection', 'httpsConnection'))
    it('should handle numbers', async () => await expectSanitized('tool-v2-api', 'toolV2Api'))
    it('should handle mixed formats', async () => await expectSanitized('Get_User-Profile2', 'getUserProfile2'))
    it('should strip special characters', async () => await expectSanitized('get@user#profile', 'getUserProfile'))
  })
})
