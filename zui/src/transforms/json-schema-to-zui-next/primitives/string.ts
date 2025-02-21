import { JSONSchema7 } from 'json-schema'
import z from '../../../z'

const stringSchema = z.object({
  type: z.literal('string'),
  'x-zui': z
    .object({
      'x-zod-checks': z
        .array(
          z
            .discriminatedUnion('kind', [
              z.object({ kind: z.literal('cuid') }),
              z.object({ kind: z.literal('cuid2') }),
              z.object({ kind: z.literal('email') }),
              z.object({
                kind: z.literal('datetime'),
                offset: z.boolean().optional(),
                precision: z.number().optional(),
              }),
              z.object({ kind: z.literal('emoji') }),
              z.object({ kind: z.literal('url') }),
              z.object({ kind: z.literal('endsWith'), value: z.string() }),
              z.object({ kind: z.literal('startsWith'), value: z.string() }),
              z.object({ kind: z.literal('includes'), value: z.string() }),
              z.object({ kind: z.literal('regex'), value: z.string() }),
              z.object({ kind: z.literal('trim') }),
              z.object({ kind: z.literal('toLowerCase') }),
              z.object({ kind: z.literal('toUpperCase') }),
              z.object({ kind: z.literal('uuid') }),
              z.object({ kind: z.literal('ip'), version: z.enum(['v4', 'v6']).optional() }),
              z.object({ kind: z.literal('length'), value: z.number() }),
              z.object({ kind: z.literal('min'), value: z.number() }),
              z.object({ kind: z.literal('max'), value: z.number() }),
              z.object({ kind: z.literal('ulid') }),
            ])
            .and(z.object({ message: z.string().optional() })),
        )
        .optional(),
    })
    .optional(),
})

export const stringJSONSchemaToZuiString = (schema: JSONSchema7): z.ZodString => {
  let zodString = z.string()
  const parsedSchema = stringSchema.parse(schema)
  const checks = parsedSchema['x-zui']?.['x-zod-checks'] ?? []

  for (const check of checks) {
    switch (check.kind) {
      case 'cuid':
        zodString = zodString.cuid({ message: check.message })
        break
      case 'cuid2':
        zodString = zodString.cuid2({ message: check.message })
        break
      case 'email':
        zodString = zodString.email({ message: check.message })
        break
      case 'datetime':
        zodString = zodString.datetime({ message: check.message, offset: check.offset, precision: check.precision })
        break
      case 'emoji':
        zodString = zodString.emoji({ message: check.message })
        break
      case 'url':
        zodString = zodString.url({ message: check.message })
        break
      case 'endsWith':
        zodString = zodString.endsWith(check.value, { message: check.message })
        break
      case 'startsWith':
        zodString = zodString.startsWith(check.value, { message: check.message })
        break
      case 'includes':
        zodString = zodString.includes(check.value, { message: check.message })
        break
      case 'regex':
        zodString = zodString.regex(new RegExp(check.value), { message: check.message })
        break
      case 'trim':
        zodString = zodString.trim()
        break
      case 'toLowerCase':
        zodString = zodString.toLowerCase()
        break
      case 'toUpperCase':
        zodString = zodString.toUpperCase()
        break
      case 'uuid':
        zodString = zodString.uuid({ message: check.message })
        break
      case 'ip':
        zodString = zodString.ip({ message: check.message, version: check.version })
        break
      case 'length':
        zodString = zodString.length(check.value, { message: check.message })
        break
      case 'min':
        zodString = zodString.min(check.value, { message: check.message })
        break
      case 'max':
        zodString = zodString.max(check.value, { message: check.message })
        break
      case 'ulid':
        zodString = zodString.ulid({ message: check.message })
        break
    }
  }

  return zodString
}
