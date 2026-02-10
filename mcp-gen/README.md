# MCP Integration Generator

Generate Botpress integrations from Model Context Protocol (MCP) servers with zero code duplication using a clean proxy pattern.

## Quick Start

```bash
# Install and build
pnpm install && pnpm build

# Initialize new integration
mcp-gen init github-mcp https://api.github.com/mcp \
  --output ./output \
  --auth ghp_your_github_token \
  --save

# Update existing integration (from saved config)
mcp-gen update
```

## Features

- **Automatic Tool Discovery**: Connects to any MCP server and discovers available tools
- **Zero Duplication**: Proxy pattern - single implementation for all tools (78% code reduction)
- **Multiple Transports**: HTTP (default) and SSE support
- **Type-Safe**: Generates Zui (Zod) schemas from JSON Schema with comprehensive validation
- **Update Mode**: Refresh tools while preserving customizations
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

Updates tool definitions from saved mcp-server.json. Preserves customizations in src/index.ts.

**Options:**

- `[output]` - Output directory (optional if config exists in current directory)
- `--auth, -a <token>` - Override authorization token
- `--header, -H <header>` - Override request headers
- `--config-file <filename>` - Custom config filename (default: mcp-server.json)

**Examples:**

```bash
# Auto-detect config in current directory or subdirectories
mcp-gen update

# Specify directory
mcp-gen update ./my-integration

# Override auth token
mcp-gen update --auth bp_pat_new_token
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
├── tool-definitions/             # One file per tool
│   ├── index.ts
│   ├── tool1.ts
│   └── tool2.ts
└── src/
    ├── index.ts                  # Proxy router (3 lines per action)
    └── mcp-proxy.ts              # Shared implementation
```

### Proxy Pattern Benefits

**Old approach** (before): 60 lines × N tools = massive duplication
**New approach**: 60 lines total + 3 lines per tool = 78% reduction

- Zero code duplication across actions
- Single point of configuration
- Easy maintenance (change once, affects all)
- Consistent error handling and authentication

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
pnpm type-check

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
# Option 1: Auto-detect config
cd my-integration
mcp-gen update

# Option 2: Specify directory
mcp-gen update ./my-integration

# Review changes
git diff

# Rebuild
cd my-integration && pnpm bpbuild
```

The update command:

- ✅ Refreshes tool definitions
- ✅ Updates schemas
- ✅ Preserves your customizations in src/index.ts
- ✅ Uses saved credentials from mcp-server.json

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

The generator creates integrations using a **clean proxy pattern**:

1. **Definitions Layer** (`tool-definitions/`): What each tool does (schemas, descriptions)
2. **Implementation Layer** (`src/mcp-proxy.ts`): How to call MCP tools (single shared implementation)
3. **Integration Layer** (`src/index.ts`): Routes actions to proxy (3 lines per action)

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
