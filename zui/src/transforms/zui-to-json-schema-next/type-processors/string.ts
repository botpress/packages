import z from '../../../z'
import * as json from '../../common/json-schema'
import { zodPatterns } from '../../zui-to-json-schema/parsers/string'

export type SerializedStringCheck =
  | { kind: 'cuid'; message: string | undefined }
  | { kind: 'cuid2'; message: string | undefined }
  | { kind: 'email'; message: string | undefined }
  | { kind: 'datetime'; message: string | undefined; offset?: boolean; precision?: number }
  | { kind: 'emoji'; message: string | undefined }
  | { kind: 'url'; message: string | undefined }
  | { kind: 'endsWith'; message: string | undefined; value: string }
  | { kind: 'startsWith'; message: string | undefined; value: string }
  | { kind: 'includes'; message: string | undefined; value: string }
  | { kind: 'regex'; message: string | undefined; value: string }
  | { kind: 'trim'; message: string | undefined }
  | { kind: 'toLowerCase'; message: string | undefined }
  | { kind: 'toUpperCase'; message: string | undefined }
  | { kind: 'uuid'; message: string | undefined }
  | { kind: 'ip'; message: string | undefined; version?: 'v4' | 'v6' }
  | { kind: 'length'; message: string | undefined; value: number }
  | { kind: 'min'; message: string | undefined; value: number }
  | { kind: 'max'; message: string | undefined; value: number }
  | { kind: 'ulid'; message: string | undefined }

export const zodStringToJsonString = (zodString: z.ZodString): json.StringSchema => {
  const schema: json.StringSchema = {
    type: 'string',
    'x-zui': zodString._def['x-zui'] ?? {},
  }
  const serializedChecks: SerializedStringCheck[] = []

  for (const check of zodString._def.checks) {
    switch (check.kind) {
      case 'cuid':
        schema.pattern = zodPatterns.cuid
        serializedChecks.push({ kind: 'cuid', message: check.message })
        break
      case 'cuid2':
        schema.pattern = zodPatterns.cuid2
        serializedChecks.push({ kind: 'cuid2', message: check.message })
        break
      case 'email':
        schema.anyOf = [
          {
            format: 'email',
          },
          {
            format: 'idn-email',
          },
        ]
        serializedChecks.push({ kind: 'email', message: check.message })
        break
      case 'datetime':
        schema.format = 'date-time'
        serializedChecks.push({
          kind: 'datetime',
          message: check.message,
          offset: check.offset,
          precision: check.precision ?? undefined,
        })
        break
      case 'emoji':
        schema.pattern = zodPatterns.emoji
        serializedChecks.push({ kind: 'emoji', message: check.message })
        break
      case 'url':
        schema.format = 'uri'
        serializedChecks.push({ kind: 'url', message: check.message })
        break
      case 'endsWith':
        schema.pattern = `${_escapeNonAlphaNumeric(check.value)}$`
        serializedChecks.push({ kind: 'endsWith', message: check.message, value: check.value })
        break
      case 'startsWith':
        schema.pattern = `^${_escapeNonAlphaNumeric(check.value)}`
        serializedChecks.push({ kind: 'startsWith', message: check.message, value: check.value })
        break
      case 'includes':
        schema.pattern = `${_escapeNonAlphaNumeric(check.value)}`
        serializedChecks.push({ kind: 'includes', message: check.message, value: check.value })
        break
      case 'regex':
        schema.pattern = check.regex.source
        serializedChecks.push({ kind: 'regex', message: check.message, value: check.regex.source })
        break
      case 'trim':
        serializedChecks.push({ kind: 'trim', message: check.message })
        break
      case 'toLowerCase':
        serializedChecks.push({ kind: 'toLowerCase', message: check.message })
        break
      case 'toUpperCase':
        serializedChecks.push({ kind: 'toUpperCase', message: check.message })
        break
      case 'uuid':
        schema.format = 'uuid'
        serializedChecks.push({ kind: 'uuid', message: check.message })
        break
      case 'ip':
        schema.format = check.version === 'v6' ? 'ipv6' : 'ipv4'
        serializedChecks.push({ kind: 'ip', message: check.message, version: check.version })
        break
      case 'length':
        schema.minLength = schema.maxLength = Math.min(
          Math.max(schema.minLength ?? 0, check.value),
          schema.maxLength ?? Infinity,
        )
        serializedChecks.push({ kind: 'length', message: check.message, value: check.value })
        break
      case 'min':
        schema.minLength = Math.min(schema.maxLength ?? Infinity, check.value)
        serializedChecks.push({ kind: 'min', message: check.message, value: check.value })
        break
      case 'max':
        schema.maxLength = Math.max(schema.minLength ?? 0, check.value)
        serializedChecks.push({ kind: 'max', message: check.message, value: check.value })
        break
      case 'ulid':
        schema.pattern = zodPatterns.ulid
        serializedChecks.push({ kind: 'ulid', message: check.message })
        break
    }
  }

  schema['x-zui'] = { ...schema['x-zui'], 'x-zod-checks': serializedChecks }

  return schema
}

const _escapeNonAlphaNumeric = (value: string): string => value.replaceAll(/[^a-z0-9]/gi, '\\$&')
