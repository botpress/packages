import * as fs from 'fs/promises'
import * as path from 'path'
import { McpClient } from './mcp-client.js'
import { ConfigManager } from './config-manager.js'
import {
  generateToolDefinitionFile,
  generateToolDefinitionsIndex,
  generateMcpProxy,
  generateActions,
  generateIntegrationDefinition,
  generateIntegrationIndex,
  generateReadme,
  generateIcon
} from './templates.js'
import { getLatestNpmVersion, writeFormattedFile } from './utils.js'
import type { GeneratorOptions, ConfigManagerOptions, McpServerInfo, UpdateScope } from './schemas.js'

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
      const scope = options.updateScope
      const hasScope = scope && (scope.tools || scope.definition || scope.code)
      if (hasScope) {
        const parts = [scope.tools && 'tools', scope.definition && 'definition', scope.code && 'code'].filter(Boolean)
        console.log(`\n⚡ Update mode: Updating ${parts.join(' + ')}`)
      } else {
        console.log('\n⚡ Update mode: Updating all')
      }
    }

    await this.generateIntegrationFiles(
      options.outputDir,
      options.integrationName,
      serverInfo,
      options.updateMode || false,
      options.updateScope
    )

    await this.client.close()

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
      console.log('\nNext step: Run `pnpm build` to rebuild')
    } else {
      console.log(`\nIntegration generated successfully at: ${options.outputDir}`)
      console.log('\nGenerated structure:')
      console.log('  - action-definitions/     # Action definitions (one per tool)')
      console.log('  - src/actions.ts        # Action proxies (MCP tool mappings)')
      console.log('  - src/mcp-proxy.ts      # Shared MCP client logic')
      console.log('  - src/index.ts          # Integration entry point')
      console.log('  - integration.definition.ts')
      console.log('  - icon.svg              # Generic MCP icon (customize if needed)')
      console.log('\nNext steps:')
      console.log('1. Review the generated files')
      console.log('2. (Optional) Replace icon.svg with a custom icon')
      console.log('3. Update hub.md with proper documentation')
      console.log('4. Run `pnpm install && pnpm bpbuild` to build the integration')
    }
  }

  private resolveFlags(updateMode: boolean, scope?: UpdateScope) {
    if (!updateMode) {
      return { tools: true, definition: true, code: true, index: true, scaffold: true }
    }
    const hasScope = scope && (scope.tools || scope.definition || scope.code)
    return {
      tools: !hasScope || !!scope?.tools,
      definition: !hasScope || !!scope?.definition,
      code: !hasScope || !!scope?.code,
      index: !!scope?.code,
      scaffold: false
    }
  }

  private async generateIntegrationFiles(
    outputDir: string,
    integrationName: string,
    serverInfo: McpServerInfo,
    updateMode: boolean = false,
    scope?: UpdateScope
  ): Promise<void> {
    await fs.mkdir(outputDir, { recursive: true })
    await fs.mkdir(path.join(outputDir, 'src'), { recursive: true })
    await fs.mkdir(path.join(outputDir, 'action-definitions'), { recursive: true })

    const flags = this.resolveFlags(updateMode, scope)

    if (flags.tools) {
      console.log('\nGenerating tool definition files...')
      let truncatedCount = 0
      for (const tool of serverInfo.tools) {
        const definitionFile = await generateToolDefinitionFile(tool)
        const filePath = path.join(outputDir, 'action-definitions', `${tool.name}.ts`)
        await writeFormattedFile(filePath, definitionFile, 'typescript')
        console.log(`  - Generated action-definitions/${tool.name}.ts`)

        if (tool.description && tool.description.length > 256) {
          truncatedCount++
        }
      }
      if (truncatedCount > 0) {
        console.log(`  ⚠ ${truncatedCount} description(s) truncated to 256 chars (Botpress limit)`)
      }

      console.log('Generating action-definitions/index.ts...')
      const toolDefsIndex = generateToolDefinitionsIndex(serverInfo.tools)
      await writeFormattedFile(path.join(outputDir, 'action-definitions', 'index.ts'), toolDefsIndex, 'typescript')

      console.log('Generating src/actions.ts...')
      const actionsFile = generateActions(serverInfo.tools)
      await writeFormattedFile(path.join(outputDir, 'src', 'actions.ts'), actionsFile, 'typescript')

      console.log('Generating hub.md...')
      const readmeFile = generateReadme(serverInfo, serverInfo.tools)
      await writeFormattedFile(path.join(outputDir, 'hub.md'), readmeFile, 'markdown')
    }

    if (flags.definition) {
      console.log('Generating integration.definition.ts...')
      const definitionFile = generateIntegrationDefinition(integrationName, serverInfo)
      await writeFormattedFile(path.join(outputDir, 'integration.definition.ts'), definitionFile, 'typescript')
    }

    if (flags.code) {
      console.log('Generating src/mcp-proxy.ts...')
      const mcpProxyFile = generateMcpProxy()
      await writeFormattedFile(path.join(outputDir, 'src', 'mcp-proxy.ts'), mcpProxyFile, 'typescript')
    }

    if (flags.index) {
      console.log('Generating src/index.ts...')
      const indexFile = generateIntegrationIndex()
      await writeFormattedFile(path.join(outputDir, 'src', 'index.ts'), indexFile, 'typescript')
    }

    if (flags.scaffold) {
      console.log('Generating icon.svg...')
      const iconFile = generateIcon()
      await writeFormattedFile(path.join(outputDir, 'icon.svg'), iconFile, 'html')

      await this.generatePackageFiles(outputDir, integrationName, serverInfo)
    }
  }

  private async generatePackageFiles(
    outputDir: string,
    integrationName: string,
    serverInfo: McpServerInfo
  ): Promise<void> {
    console.log('Generating package.json...')
    console.log('Fetching latest package versions from npm...')

    const [botpressClient, botpressSdk, zui, botpressCli] = await Promise.all([
      getLatestNpmVersion('@botpress/client', '1.27.2'),
      getLatestNpmVersion('@botpress/sdk', '4.17.2'),
      getLatestNpmVersion('@bpinternal/zui', '1.0.3'),
      getLatestNpmVersion('@botpress/cli', '5.5.3')
    ])

    const packageJson = {
      name: `@botpress/${integrationName}`,
      integrationName: integrationName,
      version: '0.1.0',
      description: `MCP Integration for ${serverInfo.name}`,
      scripts: {
        build: 'bp build',
        'check:type': 'tsc --noEmit'
      },
      private: true,
      dependencies: {
        '@botpress/client': `^${botpressClient}`,
        '@botpress/sdk': botpressSdk,
        '@bpinternal/zui': zui,
        '@modelcontextprotocol/sdk': `^1.26.0`
      },
      devDependencies: {
        '@botpress/cli': `^${botpressCli}`,
        '@types/node': `^22.15.0`,
        typescript: `^5.7.2`
      }
    }
    await writeFormattedFile(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2), 'json')

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
      include: ['src/**/*', 'action-definitions/**/*', 'integration.definition.ts'],
      exclude: ['node_modules', 'dist', '.botpress']
    }
    await writeFormattedFile(path.join(outputDir, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2), 'json')

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
