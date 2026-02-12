# MCP Integration Generator

Generate Botpress integrations from Model Context Protocol (MCP) servers using a proxy pattern.

## Quick Start

```bash
# Install and build
pnpm install && pnpm build

# Initialize new integration
mcp-gen init github-mcp https://api.github.com/mcp \
  --output ./output \
  --auth ghp_your_github_token \
  --save

# Update tools from saved config
mcp-gen update --tools
```

## Features

- **Automatic Tool Discovery**: Connects to any MCP server and discovers available tools
- **Proxy Pattern**: Single shared implementation for all tools
- **Multiple Transports**: HTTP (default) and SSE support
- **Type-Safe**: Generates Zui (Zod) schemas from JSON Schema with comprehensive validation
- **Scoped Updates**: Refresh tools, definition, or code independently
- **Config Persistence**: Claude-compatible mcp-server.json format

## CLI Commands

### `init` - Create New Integration

```bash
mcp-gen init <name> <url> --output <dir> [options]
```

**Options:**

- `--output, -o <dir>` - Output directory (required)
- `--transport, -t <type>` - Transport: `http` (default) or `sse`
- `--auth, -a <token>` - Authorization token (shortcut for Bearer header)
- `--header, -H <header>` - Add custom header (format: "Key: Value", repeatable)
- `--save` - Save config to mcp-server.json for easy updates
- `--config-file <filename>` - Custom config filename (default: mcp-server.json)

**Environment Variable:**

- `MCP_AUTH_TOKEN` - Auto-loads as Authorization Bearer token

**Examples:**

```bash
# Basic usage with shortcut auth
mcp-gen init github-mcp https://api.github.com/mcp \
  --output ./output \
  --auth ghp_your_github_token \
  --save

# With custom headers
mcp-gen init slack-mcp https://slack.com/api/mcp \
  --output ./integration \
  --header "Authorization: Bearer xoxb-token" \
  --header "X-API-Key: key123" \
  --save

# Using environment variable
export MCP_AUTH_TOKEN=ghp_your_github_token
mcp-gen init github-mcp https://api.github.com/mcp \
  --output ./output \
  --save
```

### `update` - Update Existing Integration

```bash
mcp-gen update [output] [options]
```

Updates an existing integration from saved mcp-server.json. No scope flags = update all. Use flags to select what to update.

**Scope Flags:**

- `--tools` - Update action-definitions, actions, and hub.md
- `--definition` - Update integration.definition.ts
- `--code` - Update src/index.ts and src/mcp-proxy.ts

When no scope flags are provided, all scopes are updated (equivalent to `--tools --definition --code`), except `src/index.ts` which is only regenerated with `--code` to preserve your customizations.

**Override Options:**

- `--url, -u <url>` - Override MCP server URL (instead of what's in config)
- `--transport, -t <type>` - Override transport type
- `--auth, -a <token>` - Override authorization token
- `--header, -H <header>` - Override request headers
- `--config-file <filename>` - Custom config filename (default: mcp-server.json)

**Examples:**

```bash
# Update just tools (most common)
mcp-gen update --tools

# Auto-detect config, update everything
mcp-gen update

# Specify directory
mcp-gen update ./my-integration --tools

# Override auth token for this run
mcp-gen update --auth bp_pat_new_token --tools

# Override the MCP server URL
mcp-gen update --url https://new-api.example.com/mcp --tools

# Update only the proxy code
mcp-gen update --code
```

## Config File Format

The `--save` flag creates a `mcp-server.json` file (Claude-compatible):

```json
{
  "name": "github-mcp",
  "url": "https://api.github.com/mcp",
  "type": "http",
  "headers": {
    "Authorization": "Bearer ghp_your_github_token"
  }
}
```

This enables easy updates without re-entering credentials.

## Generated Structure

```
output/
├── package.json
├── tsconfig.json
├── .gitignore
├── integration.definition.ts    # Integration metadata
├── hub.md                        # Documentation
├── icon.svg                      # Generic MCP icon (customize)
├── action-definitions/             # One file per tool
│   ├── index.ts
│   ├── tool1.ts
│   └── tool2.ts
└── src/
    ├── index.ts                  # Integration entry point
    ├── actions.ts                # Action router (MCP tool mappings)
    └── mcp-proxy.ts              # Shared MCP proxy implementation
```

### Proxy Pattern

The integration uses a shared proxy implementation that routes all tool calls through a single codebase:

- Single point of configuration
- Easy maintenance (change once, affects all)
- Consistent error handling and authentication
- Clean separation between definitions and implementation

## Programmatic API

```typescript
import { generateIntegration } from '@bpinternal/mcp-gen'

await generateIntegration({
  integrationName: 'github-mcp',
  mcpServerUrl: 'https://api.github.com/mcp',
  outputDir: './output',
  transport: 'http',
  headers: {
    Authorization: 'Bearer ghp_your_github_token'
  },
  saveConfig: true,
  updateMode: false
})
```

### With Config Auto-Loading

```typescript
import { generateIntegrationWithConfig } from '@bpinternal/mcp-gen'

// Uses saved config from mcp-server.json
await generateIntegrationWithConfig({
  outputDir: './my-integration',
  updateMode: true // Only update tool definitions
})
```

### TypeScript Types

```typescript
import type { GeneratorOptions, TransportType, McpServerConfig } from '@bpinternal/mcp-gen'
```

## Validation

All inputs are validated using Zod schemas:

- **Integration names**: Lowercase alphanumeric + hyphens, max 50 chars
- **URLs**: Valid HTTP/HTTPS URLs only
- **Paths**: Path traversal prevention
- **Headers**: RFC 7230 compliant header names and non-empty values
- **Transport types**: Only `http` or `sse` allowed

## Development

```bash
# Run from source (no build needed)
pnpm dev init github-mcp https://api.github.com/mcp --output ./output

# Watch mode (auto-rebuild)
pnpm watch

# Build
pnpm build

# Type check
pnpm check:type

# Install globally
pnpm link --global
mcp-gen --help
```

## Next Steps After Generation

1. **Install dependencies**: `cd output && pnpm install`
2. **Build integration**: `pnpm bpbuild`
3. **Customize icon** (optional): Replace `icon.svg`
4. **Update documentation**: Enhance `hub.md`
5. **Test in Botpress**: Deploy and test actions

## Updating When MCP Server Changes

```bash
# Most common: just refresh tools
mcp-gen update --tools

# Or update everything
mcp-gen update

# Review changes
git diff

# Rebuild
pnpm bpbuild
```

The update command:

- Refreshes tool definitions, actions, and hub.md (`--tools`)
- Updates integration.definition.ts (`--definition`)
- Updates src/mcp-proxy.ts and src/index.ts (`--code`)
- Uses saved credentials from mcp-server.json

## Troubleshooting

### Connection Errors

- Ensure MCP server is running
- Verify URL is correct
- Check authentication token is valid

### Validation Errors

- Integration name must be lowercase with hyphens only
- URLs must use http:// or https:// protocol
- Headers must follow "Key: Value" format

### Build Errors

- Run `pnpm install` in generated directory
- Verify all dependencies are available
- Check TypeScript configuration

## Transport Types

- **HTTP** (default): Streamable HTTP transport - best for most MCP servers
- **SSE**: Server-Sent Events transport - for SSE-only servers

Specify with `--transport sse` if needed.

## Architecture

The generator creates integrations using a **proxy pattern**:

1. **Definitions Layer** (`action-definitions/`): What each tool does (schemas, descriptions)
2. **Actions Layer** (`src/actions.ts`): Maps each action to its MCP tool call via the proxy
3. **Implementation Layer** (`src/mcp-proxy.ts`): How to call MCP tools (single shared implementation)
4. **Integration Layer** (`src/index.ts`): Entry point that wires everything together

### Tool Name Sanitization

Tool names are automatically converted to proper camelCase for Botpress:

| MCP Tool Name                 | Action Name                   | MCP Call Uses |
| ----------------------------- | ----------------------------- | ------------- |
| `dbGetRDSPerformanceInsights` | `dbGetRdsPerformanceInsights` | Original name |
| `get-user-profile`            | `getUserProfile`              | Original name |
| `create_workspace`            | `createWorkspace`             | Original name |

The proxy always uses the original tool name when calling the MCP server.

## License

MIT
