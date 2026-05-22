export { IntegrationGenerator } from './generator.js'
export type { GeneratorOptions, UpdateScope } from './schemas.js'
export type { TransportType } from './schemas.js'
export { ConfigManager } from './config-manager.js'
export type { McpServerConfig, ConfigManagerOptions } from './schemas.js'

import { IntegrationGenerator } from './generator.js'
import { ConfigManager } from './config-manager.js'
import { integrationNameSchema, urlSchema } from './schemas.js'
import type { GeneratorOptions } from './schemas.js'

export const generateIntegration = async (options: GeneratorOptions): Promise<void> => {
  integrationNameSchema.parse(options.integrationName)
  urlSchema.parse(options.mcpServerUrl)

  const generator = new IntegrationGenerator({
    configFilename: options.configFilename
  })

  await generator.generate(options)
}

export const generateIntegrationWithConfig = async (
  options: Partial<GeneratorOptions> & { outputDir: string; integrationName?: string }
): Promise<void> => {
  const configManager = new ConfigManager({
    configFilename: options.configFilename
  })
  const generator = new IntegrationGenerator({
    configFilename: options.configFilename
  })

  const savedConfig = await configManager.load(options.outputDir)

  const integrationName = options.integrationName || savedConfig?.name
  if (!integrationName) {
    throw new Error('integrationName is required (provide in options or ensure mcp-server.json exists with name field)')
  }

  const mcpServerUrl = options.mcpServerUrl || savedConfig?.url
  if (!mcpServerUrl) {
    throw new Error('mcpServerUrl is required (provide in options or ensure mcp-server.json exists)')
  }

  integrationNameSchema.parse(integrationName)
  urlSchema.parse(mcpServerUrl)

  const fullOptions: GeneratorOptions = {
    integrationName,
    mcpServerUrl,
    outputDir: options.outputDir,
    transport: options.transport || savedConfig?.type || 'http',
    headers: { ...savedConfig?.headers, ...options.headers },
    updateMode: options.updateMode ?? false,
    saveConfig: options.saveConfig ?? false,
    configFilename: options.configFilename
  }

  await generator.generate(fullOptions)
}
