import { JSONSchema7 } from 'json-schema'
import { zodPatterns } from '../../zui-to-json-schema/parsers/string'
import z from '../../../z'
import * as datetime from '../../../z/types/string/datetime'

const stringSchema = z.object({
  type: z.literal('string'),
  format: z.enum(['cuid', 'cuid2', 'emoji', 'ulid', 'date-time', 'email', 'ipv4', 'ipv6', 'uri', 'uuid']).optional(),
  pattern: z.string().optional(),
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
})

export const stringJSONSchemaToZuiString = (schema: JSONSchema7): z.ZodString => {
  let zodString = z.string()
  const { format, pattern, minLength, maxLength } = stringSchema.parse(schema)

  if (minLength && maxLength && minLength === maxLength) {
    zodString = zodString.length(minLength)
  } else {
    if (minLength) {
      zodString = zodString.min(minLength)
    }
    if (maxLength) {
      zodString = zodString.max(maxLength)
    }
  }

  if (format === 'cuid' || pattern === zodPatterns.cuid) {
    zodString = zodString.cuid()
  } else if (format === 'cuid2' || pattern === zodPatterns.cuid2) {
    zodString = zodString.cuid2()
  } else if (format === 'emoji' || pattern === zodPatterns.emoji) {
    zodString = zodString.emoji()
  } else if (format === 'ulid' || pattern === zodPatterns.ulid) {
    zodString = zodString.ulid()
  } else if (format === 'date-time') {
    const { precision, offset } = pattern ? datetime.extractPrecisionAndOffset(pattern) : {}
    zodString = zodString.datetime({ precision, offset })
  } else if (format === 'email' || pattern === zodPatterns.email) {
    zodString = zodString.email()
  } else if (format === 'ipv4' || pattern === zodPatterns.ipv4) {
    zodString = zodString.ip()
  } else if (format === 'ipv6' || pattern === zodPatterns.ipv6) {
    zodString = zodString.ip('v6')
  } else if (format === 'uri') {
    zodString = zodString.url()
  } else if (format === 'uuid' || pattern === zodPatterns.uuid) {
    zodString = zodString.uuid()
  } else if (pattern) {
    zodString = zodString.regex(new RegExp(pattern))
  }

  return zodString
}
