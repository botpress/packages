export { IntegrationGenerator } from './generator.js'
export type { GeneratorOptions } from './generator.js'
export type { TransportType } from './mcp-client.js'
export { ConfigManager, type McpServerConfig, type ConfigManagerOptions } from './config-manager.js'

import { IntegrationGenerator, type GeneratorOptions } from './generator.js'
import { ConfigManager } from './config-manager.js'
import { validateIntegrationName, validateUrl } from './validators.js'

export async function generateIntegration(options: GeneratorOptions): Promise<void> {
  validateIntegrationName(options.integrationName)
  validateUrl(options.mcpServerUrl)

  const generator = new IntegrationGenerator({
    configFilename: options.configFilename
  })

  await generator.generate(options)
}

export async function generateIntegrationWithConfig(
  options: Partial<GeneratorOptions> & { outputDir: string; integrationName?: string }
): Promise<void> {
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

  validateIntegrationName(integrationName)
  validateUrl(mcpServerUrl)

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
