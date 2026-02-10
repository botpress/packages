import * as fs from 'fs/promises'
import * as path from 'path'
import { z } from '@botpress/sdk'
import { urlSchema, transportTypeSchema, headersSchema, validatePath, integrationNameSchema } from './validators.js'

const mcpServerConfigSchema = z.object({
  name: integrationNameSchema,
  url: urlSchema,
  type: transportTypeSchema,
  headers: headersSchema.optional()
})

export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>

export interface ConfigManagerOptions {
  configFilename?: string
}

export class ConfigManager {
  private configFilename: string

  constructor(options: ConfigManagerOptions = {}) {
    this.configFilename = options.configFilename ?? 'mcp-server.json'
  }

  async save(outputDir: string, config: McpServerConfig): Promise<void> {
    validatePath(outputDir)

    const validatedConfig = mcpServerConfigSchema.parse(config)

    await fs.mkdir(outputDir, { recursive: true })

    const configPath = path.join(outputDir, this.configFilename)
    const normalized = path.normalize(configPath)

    if (!normalized.includes(path.normalize(outputDir))) {
      throw new Error('Security: Config path escapes output directory')
    }

    try {
      await fs.writeFile(
        configPath,
        JSON.stringify(validatedConfig, null, 2),
        { encoding: 'utf-8', mode: 0o644 }
      )
      console.log(`  ✓ Saved MCP server config to ${this.configFilename}`)
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to save config: ${error.message}`)
      }
      throw error
    }
  }

  async load(outputDir: string): Promise<McpServerConfig | null> {
    if (!outputDir?.trim()) {
      throw new Error('Output directory path is required')
    }

    const configPath = path.join(outputDir, this.configFilename)
    const normalized = path.normalize(configPath)

    if (!normalized.includes(path.normalize(outputDir))) {
      throw new Error('Security: Config path escapes output directory')
    }

    try {
      const content = await fs.readFile(configPath, 'utf-8')

      if (!content.trim()) {
        console.warn(`  ⚠ Config file ${configPath} is empty`)
        return null
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch (parseError) {
        console.warn(`  ⚠ Invalid JSON in ${this.configFilename}:`, parseError)
        return null
      }

      const result = mcpServerConfigSchema.safeParse(parsed)
      if (!result.success) {
        console.warn(`  ⚠ Invalid config structure in ${this.configFilename}:`, result.error.format())
        return null
      }

      return result.data
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        const code = (error as NodeJS.ErrnoException).code
        if (code !== 'ENOENT') {
          console.warn(`  ⚠ Error reading config from ${configPath}:`, error.message)
        }
      }
      return null
    }
  }

  async findConfig(
    startDir: string = process.cwd(),
    maxDepth: number = 2
  ): Promise<{ dir: string; config: McpServerConfig } | null> {
    return this.findConfigRecursive(startDir, 0, maxDepth)
  }

  createConfig(name: string, url: string, type: 'http' | 'sse', headers?: Record<string, string>): McpServerConfig {
    const config = mcpServerConfigSchema.parse({
      name,
      url,
      type,
      headers
    })

    return config
  }

  private async findConfigRecursive(
    dir: string,
    currentDepth: number,
    maxDepth: number
  ): Promise<{ dir: string; config: McpServerConfig } | null> {
    if (currentDepth > maxDepth) {
      return null
    }

    const currentConfig = await this.load(dir)
    if (currentConfig) {
      return { dir, config: currentConfig }
    }

    if (currentDepth < maxDepth) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true })

        const subDirs = entries
          .filter(entry => entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules')
          .slice(0, 50)

        for (const entry of subDirs) {
          const subDir = path.join(dir, entry.name)
          const found = await this.findConfigRecursive(subDir, currentDepth + 1, maxDepth)
          if (found) {
            return found
          }
        }
      } catch (error) {
        if (error instanceof Error && 'code' in error) {
          const code = (error as NodeJS.ErrnoException).code
          if (code === 'EACCES' || code === 'EPERM') {
            console.warn(`  ⚠ Permission denied reading directory: ${dir}`)
          }
        }
      }
    }

    return null
  }
}
