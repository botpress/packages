import * as prettier from 'prettier'
import * as fs from 'fs/promises'
import type { PrettierParser } from './schemas.js'

export const writeFormattedFile = async (filePath: string, content: string, parser: PrettierParser): Promise<void> => {
  const formatted = await prettier.format(content, {
    parser,
    printWidth: 120,
    singleQuote: true,
    trailingComma: 'none',
    semi: false,
    bracketSpacing: true,
    requirePragma: false
  })
  await fs.writeFile(filePath, formatted, 'utf-8')
}

export const getLatestNpmVersion = async (packageName: string, fallbackVersion: string): Promise<string> => {
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

export const parseHeaders = (
  headerArgs: string[] | undefined,
  savedHeaders?: Record<string, string>
): Record<string, string> => {
  const headers: Record<string, string> = savedHeaders || {}

  if (headerArgs) {
    for (const header of headerArgs) {
      const colonIndex = header.indexOf(':')
      if (colonIndex <= 0) {
        throw new Error(`Invalid header format: "${header}". Expected "Key: Value"`)
      }

      const key = header.substring(0, colonIndex).trim()
      const value = header.substring(colonIndex + 1).trim()

      headers[key] = value
    }
  }

  return headers
}
