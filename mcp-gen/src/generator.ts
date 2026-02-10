import * as fs from 'fs/promises'
import * as path from 'path'
import { McpClient, type McpServerInfo, type TransportType } from './mcp-client.js'
import { ConfigManager, type ConfigManagerOptions } from './config-manager.js'
import {
  generateToolDefinitionFile,
  generateToolDefinitionsIndex,
  generateMcpProxy,
  generateIntegrationDefinition,
  generateIntegrationIndex,
  generateReadme,
  generateIcon
} from './templates.js'

async function getLatestNpmVersion(packageName: string, fallbackVersion: string): Promise<string> {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`)
    if (!response.ok) {
      console.warn(`  ⚠ Could not fetch ${packageName}, using fallback: ${fallbackVersion}`)
      return fallbackVersion
    }
    const data = (await response.json()) as { version: string }
    return data.version
  } catch (error) {
    console.warn(`  ⚠ Error fetching ${packageName}, using fallback: ${fallbackVersion}`)
    return fallbackVersion
  }
}

export interface GeneratorOptions {
  mcpServerUrl: string
  outputDir: string
  integrationName: string
  headers?: Record<string, string>
  transport?: TransportType
  updateMode?: boolean // Only update tool definitions and proxy, preserve customizations
  saveConfig?: boolean // Whether to save config to file
  configFilename?: string // Custom config filename
}

export class IntegrationGenerator {
  private client: McpClient
  private configManager: ConfigManager

  constructor(options?: ConfigManagerOptions) {
    this.client = new McpClient()
    this.configManager = new ConfigManager(options)
  }

  async generate(options: GeneratorOptions): Promise<void> {
    const transportType = options.transport || 'http'
    console.log(`Connecting to MCP server: ${options.mcpServerUrl}`)
    console.log(`Using transport: ${transportType}`)

    if (options.headers && Object.keys(options.headers).length > 0) {
      console.log('Using request headers:', Object.keys(options.headers).join(', '))
    }

    await this.client.connect(options.mcpServerUrl, transportType, options.headers || {})

    console.log('Fetching server info and tools...')
    const serverInfo = await this.client.getServerInfo()

    console.log(`Found ${serverInfo.tools.length} tools`)
    console.log('Tools:', serverInfo.tools.map((t) => t.name).join(', '))

    if (options.updateMode) {
      console.log('\n⚡ Update mode: Only updating tool definitions and proxy')
    }

    await this.generateIntegrationFiles(
      options.outputDir,
      options.integrationName,
      serverInfo,
      options.updateMode || false
    )

    await this.client.close()

    // Save MCP server config for future updates if requested (Claude-compatible format)
    if (options.saveConfig) {
      const config = this.configManager.createConfig(
        options.integrationName,
        options.mcpServerUrl,
        transportType,
        options.headers
      )
      await this.configManager.save(options.outputDir, config)
    }

    if (options.updateMode) {
      console.log(`\n✓ Integration updated at: ${options.outputDir}`)
      console.log('\nUpdated:')
      console.log('  ✓ tool-definitions/     # Tool schemas refreshed')
      console.log('  ✓ src/mcp-proxy.ts      # Proxy implementation updated')
      console.log('\nPreserved (not modified):')
      console.log('  • integration.definition.ts')
      console.log('  • src/index.ts')
      console.log('  • package.json')
      console.log('  • hub.md, icon.svg')
      console.log('\nNext step: Run `pnpm bpbuild` to rebuild')
    } else {
      console.log(`\nIntegration generated successfully at: ${options.outputDir}`)
      console.log('\nGenerated structure:')
      console.log('  - tool-definitions/     # Action definitions (one per tool)')
      console.log('  - src/mcp-proxy.ts      # Shared MCP client logic')
      console.log('  - src/index.ts          # Integration entry with proxy pattern')
      console.log('  - integration.definition.ts')
      console.log('  - icon.svg              # Generic MCP icon (customize if needed)')
      console.log('\nNext steps:')
      console.log('1. Review the generated files')
      console.log('2. (Optional) Replace icon.svg with a custom icon')
      console.log('3. Update hub.md with proper documentation')
      console.log('4. Run `pnpm install && pnpm bpbuild` to build the integration')
    }
  }

  private async generateIntegrationFiles(
    outputDir: string,
    integrationName: string,
    serverInfo: McpServerInfo,
    updateMode: boolean = false
  ): Promise<void> {
    // Create directory structure
    await fs.mkdir(outputDir, { recursive: true })
    await fs.mkdir(path.join(outputDir, 'src'), { recursive: true })
    await fs.mkdir(path.join(outputDir, 'tool-definitions'), { recursive: true })

    // Generate tool definition files
    console.log('\nGenerating tool definition files...')
    let truncatedCount = 0
    for (const tool of serverInfo.tools) {
      const definitionFile = await generateToolDefinitionFile(tool)
      const filePath = path.join(outputDir, 'tool-definitions', `${tool.name}.ts`)
      await fs.writeFile(filePath, definitionFile, 'utf-8')
      console.log(`  - Generated tool-definitions/${tool.name}.ts`)

      // Track truncated descriptions
      if (tool.description && tool.description.length > 256) {
        truncatedCount++
      }
    }
    if (truncatedCount > 0) {
      console.log(`  ⚠ ${truncatedCount} description(s) truncated to 256 chars (Botpress limit)`)
    }

    // Generate tool-definitions/index.ts
    console.log('Generating tool-definitions/index.ts...')
    const toolDefsIndex = generateToolDefinitionsIndex(serverInfo.tools)
    await fs.writeFile(path.join(outputDir, 'tool-definitions', 'index.ts'), toolDefsIndex, 'utf-8')

    // Generate src/mcp-proxy.ts
    console.log('Generating src/mcp-proxy.ts...')
    const mcpProxyFile = generateMcpProxy()
    await fs.writeFile(path.join(outputDir, 'src', 'mcp-proxy.ts'), mcpProxyFile, 'utf-8')

    if (updateMode) {
      console.log('\n✓ Update mode: Tool definitions and proxy updated')
      console.log('  Skipped: integration.definition.ts, src/index.ts, package.json (preserved customizations)')
      return
    }

    // Generate integration.definition.ts
    console.log('Generating integration.definition.ts...')
    const definitionFile = generateIntegrationDefinition(integrationName, serverInfo, serverInfo.tools)
    await fs.writeFile(path.join(outputDir, 'integration.definition.ts'), definitionFile, 'utf-8')

    // Generate src/index.ts
    console.log('Generating src/index.ts...')
    const indexFile = generateIntegrationIndex(serverInfo.tools)
    await fs.writeFile(path.join(outputDir, 'src', 'index.ts'), indexFile, 'utf-8')

    // Generate hub.md
    console.log('Generating hub.md...')
    const readmeFile = generateReadme(serverInfo, serverInfo.tools)
    await fs.writeFile(path.join(outputDir, 'hub.md'), readmeFile, 'utf-8')

    // Generate icon.svg
    console.log('Generating icon.svg...')
    const iconFile = generateIcon()
    await fs.writeFile(path.join(outputDir, 'icon.svg'), iconFile, 'utf-8')

    // Generate package.json
    console.log('Generating package.json...')
    console.log('Fetching latest package versions from npm...')

    // Fetch latest versions (with fallbacks)
    const [botpressClient, botpressSdk, zui, mcpSdk, botpressCli, typesNode, typescript] = await Promise.all([
      getLatestNpmVersion('@botpress/client', '1.27.2'),
      getLatestNpmVersion('@botpress/sdk', '4.17.2'),
      getLatestNpmVersion('@bpinternal/zui', '1.0.3'),
      getLatestNpmVersion('@modelcontextprotocol/sdk', '1.26.0'),
      getLatestNpmVersion('@botpress/cli', '5.5.3'),
      getLatestNpmVersion('@types/node', '22.15.0'),
      getLatestNpmVersion('typescript', '5.7.2')
    ])

    const packageJson = {
      name: `@botpress/${integrationName}`,
      integrationName: integrationName,
      version: '0.1.0',
      description: `MCP Integration for ${serverInfo.name}`,
      scripts: {
        bpbuild: 'bp build',
        'check:type': 'tsc --noEmit'
      },
      private: true,
      dependencies: {
        '@botpress/client': `^${botpressClient}`,
        '@botpress/sdk': botpressSdk,
        '@bpinternal/zui': zui,
        '@modelcontextprotocol/sdk': `^${mcpSdk}`
      },
      devDependencies: {
        '@botpress/cli': `^${botpressCli}`,
        '@types/node': `^${typesNode}`,
        typescript: `^${typescript}`
      }
    }
    await fs.writeFile(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'utf-8')

    // Generate tsconfig.json
    console.log('Generating tsconfig.json...')
    const tsConfig = {
      compilerOptions: {
        jsx: 'react-jsx',
        jsxImportSource: 'preact',
        baseUrl: '.',
        outDir: 'dist',
        experimentalDecorators: true,
        emitDecoratorMetadata: true
      },
      include: ['src/**/*', 'tool-definitions/**/*', 'integration.definition.ts'],
      exclude: ['node_modules', 'dist', '.botpress']
    }
    await fs.writeFile(path.join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2), 'utf-8')

    // Generate .gitignore
    console.log('Generating .gitignore...')
    const gitignore = `node_modules
dist
.botpress
*.log
.env
.env.local
mcp-server.json
`
    await fs.writeFile(path.join(outputDir, '.gitignore'), gitignore, 'utf-8')
  }
}
