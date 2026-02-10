#!/usr/bin/env node

import { Command, Option } from 'commander'
import { ZodError } from '@botpress/sdk'
import { IntegrationGenerator, type GeneratorOptions } from './generator.js'
import { ConfigManager, type McpServerConfig } from './config-manager.js'
import {
  validateIntegrationName,
  validateUrl,
  validateTransportType,
  parseHeaders
} from './validators.js'

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => issue.message).join(', ')
}

interface InitOptions {
  output: string
  transport: string
  auth?: string
  header?: string[]
  save: boolean
  configFile: string
}

interface UpdateOptions {
  auth?: string
  header?: string[]
  configFile: string
}

const program = new Command()

program.name('mcp-gen').description('Generate Botpress integrations from MCP servers').version('0.1.0')

program
  .command('init')
  .description('Initialize a new Botpress integration from an MCP server')
  .argument('<name>', 'Integration name (e.g., sauron-mcp)')
  .argument('<url>', 'MCP server URL')
  .requiredOption('-o, --output <dir>', 'Output directory')
  .option('-t, --transport <type>', 'Transport type: http or sse (default: http)', 'http')
  .addOption(
    new Option('-a, --auth <token>', 'Authorization token (sets Authorization: Bearer <token> header)').env(
      'MCP_AUTH_TOKEN'
    )
  )
  .option('-H, --header <header...>', 'Add request header (format: "Key: Value")')
  .option('--save', 'Save MCP server config to mcp-server.json for easy updates', false)
  .option('--config-file <filename>', 'Custom config filename (default: mcp-server.json)', 'mcp-server.json')
  .action(async (name: string, url: string, options: InitOptions) => {
    try {
      validateIntegrationName(name)
      validateUrl(url)
      validateTransportType(options.transport)

      const transport = options.transport

      const headers = parseHeaders(options.header)

      if (options.auth) {
        headers['Authorization'] = `Bearer ${options.auth}`
      }

      const generatorOptions: GeneratorOptions = {
        integrationName: name,
        mcpServerUrl: url,
        outputDir: options.output,
        transport,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        updateMode: false,
        saveConfig: options.save,
        configFilename: options.configFile
      }

      const generator = new IntegrationGenerator({
        configFilename: options.configFile
      })

      await generator.generate(generatorOptions)
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`Validation error: ${formatZodError(error)}`)
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`)

        if (error.message.includes('ECONNREFUSED') || error.message.includes('connect')) {
          console.error('Hint: Ensure the MCP server is running and accessible')
        } else if (error.message.includes('401') || error.message.includes('403')) {
          console.error('Hint: Check your authorization token')
        }
      } else {
        console.error('Error generating integration:', error)
      }
      process.exit(1)
    }
  })

program
  .command('update')
  .description('Update an existing integration (refreshes tool definitions and proxy)')
  .argument('[output]', 'Output directory (optional if mcp-server.json exists in current directory)')
  .addOption(
    new Option('-a, --auth <token>', 'Override authorization token (sets Authorization: Bearer <token> header)').env(
      'MCP_AUTH_TOKEN'
    )
  )
  .option('-H, --header <header...>', 'Override request headers (format: "Key: Value")')
  .option('--config-file <filename>', 'Custom config filename (default: mcp-server.json)', 'mcp-server.json')
  .action(async (outputArg: string | undefined, options: UpdateOptions) => {
    try {
      const configManager = new ConfigManager({
        configFilename: options.configFile
      })

      let outputDir: string
      let savedConfig: McpServerConfig

      if (outputArg) {
        outputDir = outputArg
        const loaded = await configManager.load(outputDir)
        if (!loaded) {
          throw new Error(`No ${options.configFile} found in ${outputDir}. Run "mcp-gen init --save" first.`)
        }
        savedConfig = loaded
      } else {
        const found = await configManager.findConfig()
        if (!found) {
          throw new Error(
            `No ${options.configFile} found in current directory or subdirectories. ` +
              'Run "mcp-gen init --save" first or specify output directory.'
          )
        }
        outputDir = found.dir
        savedConfig = found.config
        console.log(`✓ Found config in: ${outputDir}`)
      }

      console.log(`✓ Loaded MCP server config from ${options.configFile}`)

      const headers = parseHeaders(options.header, savedConfig.headers)

      if (options.auth) {
        headers['Authorization'] = `Bearer ${options.auth}`
      }

      const generatorOptions: GeneratorOptions = {
        integrationName: savedConfig.name,
        mcpServerUrl: savedConfig.url,
        outputDir,
        transport: savedConfig.type,
        headers: Object.keys(headers).length > 0 ? headers : undefined,
        updateMode: true,
        saveConfig: false,
        configFilename: options.configFile
      }

      const generator = new IntegrationGenerator({
        configFilename: options.configFile
      })

      await generator.generate(generatorOptions)
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(`Validation error: ${formatZodError(error)}`)
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`)
      } else {
        console.error('Error updating integration:', error)
      }
      process.exit(1)
    }
  })

program.parse()
