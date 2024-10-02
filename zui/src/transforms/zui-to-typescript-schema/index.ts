import z, { util } from '../../z'
import { escapeString, getMultilineComment, mapValues, toTypesriptPrimitive } from '../zui-to-typescript-type/utils'

export type TypescriptExpressionGenerationOptions = {}

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns a typescript program that would construct the given schema if executed
 */
export function toTypescriptSchema(schema: z.Schema, _options?: TypescriptExpressionGenerationOptions): string {
  let wrappedSchema: z.Schema = schema
  let dts = sUnwrapZod(wrappedSchema)
  return dts
}

function sUnwrapZod(schema: z.Schema): string {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return `${getMultilineComment(def.description)}z.string()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return `${getMultilineComment(def.description)}z.number()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNaN:
      return `${getMultilineComment(def.description)}z.nan()`.trim()

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return `${getMultilineComment(def.description)}z.bigint()`.trim()

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return `${getMultilineComment(schema._def.description)}z.boolean()`.trim()

    case z.ZodFirstPartyTypeKind.ZodDate:
      return `${getMultilineComment(def.description)}z.date()`.trim()

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return `${getMultilineComment(def.description)}z.undefined()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNull:
      return `${getMultilineComment(def.description)}z.null()`.trim()

    case z.ZodFirstPartyTypeKind.ZodAny:
      return `${getMultilineComment(def.description)}z.any()`.trim()

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return `${getMultilineComment(def.description)}z.unknown()`.trim()

    case z.ZodFirstPartyTypeKind.ZodNever:
      return `${getMultilineComment(def.description)}z.never()`.trim()

    case z.ZodFirstPartyTypeKind.ZodVoid:
      return `${getMultilineComment(def.description)}z.void()`.trim()

    case z.ZodFirstPartyTypeKind.ZodArray:
      const item = sUnwrapZod(def.type)
      return `z.array(${item})`

    case z.ZodFirstPartyTypeKind.ZodObject:
      const props = mapValues((schema as z.ZodObject<any>).shape, (value) => {
        if (value instanceof z.Schema) {
          return sUnwrapZod(value)
        }
        return `z.any()`
      })

      return `${getMultilineComment(def.description)}z.object({
${Object.entries(props)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join(',\n')}
})`.trim()
    case z.ZodFirstPartyTypeKind.ZodUnion:
      const options = ((schema as z.ZodUnion<any>).options as z.ZodSchema[]).map((option) => {
        return sUnwrapZod(option)
      })
      return `${getMultilineComment(def.description)}z.union([${options.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      const opts = ((schema as z.ZodDiscriminatedUnion<any, any>).options as z.ZodSchema[]).map((option) => {
        return sUnwrapZod(option)
      })
      const discriminator = escapeString(def.discriminator)
      return `${getMultilineComment(def.description)}z.discriminatedUnion(${discriminator}, [${opts.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      const left: string = sUnwrapZod(def.left)
      const right: string = sUnwrapZod(def.right)
      return `${getMultilineComment(def.description)}z.intersection(${left}, ${right})`.trim()

    case z.ZodFirstPartyTypeKind.ZodTuple:
      const items = def.items.map((i: any) => sUnwrapZod(i))
      return `${getMultilineComment(def.description)}z.tuple([${items.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodRecord:
      const keyType = sUnwrapZod(def.keyType)
      const valueType = sUnwrapZod(def.valueType)
      return `${getMultilineComment(def.description)}z.record(${keyType}, ${valueType})`.trim()

    case z.ZodFirstPartyTypeKind.ZodMap:
      const mapKeyType = sUnwrapZod(def.keyType)
      const mapValueType = sUnwrapZod(def.valueType)
      return `${getMultilineComment(def.description)}z.map(${mapKeyType}, ${mapValueType})`.trim()

    case z.ZodFirstPartyTypeKind.ZodSet:
      return `${getMultilineComment(def.description)}z.set(${sUnwrapZod(def.valueType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodFunction:
      throw new Error('ZodFunction cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodLazy:
      throw new Error('ZodLazy cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      const value = toTypesriptPrimitive(def.value)
      return `${getMultilineComment(def.description)}z.literal(${value})`.trim()

    case z.ZodFirstPartyTypeKind.ZodEnum:
      const values = def.values.map((v: any) => toTypesriptPrimitive(v))
      return `${getMultilineComment(def.description)}z.enum([${values.join(', ')}])`.trim()

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new Error('ZodEffects cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new Error('ZodNativeEnum cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return `${getMultilineComment(def.description)}z.optional(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return `${getMultilineComment(def.description)}z.nullable(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodDefault:
      throw new Error('ZodDefault cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodCatch:
      throw new Error('ZodCatch cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodPromise:
      return `${getMultilineComment(def.description)}z.promise(${sUnwrapZod(def.type)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodBranded:
      return `${getMultilineComment(def.description)}z.brand(${sUnwrapZod(def.type)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new Error('ZodPipeline cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new Error('ZodSymbol cannot be transformed to TypeScript expression yet')

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return `${getMultilineComment(def.description)}z.readonly(${sUnwrapZod(def.innerType)})`.trim()

    case z.ZodFirstPartyTypeKind.ZodRef:
      const uri = escapeString(def.uri)
      return `${getMultilineComment(def.description)}z.ref(${uri})`.trim()

    case z.ZodFirstPartyTypeKind.ZodTemplateLiteral:
      throw new Error('ZodTemplateLiteral cannot be transformed to TypeScript expression yet')

    default:
      util.assertNever(def)
  }
}
