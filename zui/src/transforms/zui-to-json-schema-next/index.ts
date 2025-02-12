import { ZuiExtensionObject } from '../../ui/types'
import z from '../../z'
import * as json from '../common/json-schema'

/**
 *
 * @param schema zui schema
 * @param options generation options
 * @returns ZUI flavored of JSON schema
 */
export function toJsonSchema(schema: z.Schema): json.ZuiJsonSchema {
  return _toJsonSchema(schema)
}

const undefinedSchema = (xZui?: ZuiExtensionObject): json.UndefinedSchema => ({
  not: true,
  'x-zui': { ...xZui, def: { typeName: z.ZodFirstPartyTypeKind.ZodUndefined } },
})

const nullSchema = (xZui?: ZuiExtensionObject): json.NullSchema => ({
  type: 'null',
  'x-zui': xZui,
})

function _toJsonSchema(schema: z.Schema): json.ZuiJsonSchema {
  const schemaTyped = schema as z.ZodFirstPartySchemaTypes
  const def = schemaTyped._def

  switch (def.typeName) {
    case z.ZodFirstPartyTypeKind.ZodString:
      return { type: 'string', 'x-zui': def['x-zui'] } satisfies json.StringSchema

    case z.ZodFirstPartyTypeKind.ZodNumber:
      return { type: 'number', 'x-zui': def['x-zui'] } satisfies json.NumberSchema

    case z.ZodFirstPartyTypeKind.ZodNaN:
      return { type: 'number', 'x-zui': def['x-zui'] } satisfies json.NumberSchema

    case z.ZodFirstPartyTypeKind.ZodBigInt:
      return { type: 'integer', 'x-zui': def['x-zui'] } satisfies json.BigIntSchema

    case z.ZodFirstPartyTypeKind.ZodBoolean:
      return { type: 'boolean', 'x-zui': def['x-zui'] } satisfies json.BooleanSchema

    case z.ZodFirstPartyTypeKind.ZodDate:
      return { type: 'string', format: 'date-time', 'x-zui': def['x-zui'] } satisfies json.DateSchema

    case z.ZodFirstPartyTypeKind.ZodUndefined:
      return undefinedSchema(def['x-zui'])

    case z.ZodFirstPartyTypeKind.ZodNull:
      return nullSchema(def['x-zui'])

    case z.ZodFirstPartyTypeKind.ZodAny:
      return {
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodAny } },
      } satisfies json.AnySchema

    case z.ZodFirstPartyTypeKind.ZodUnknown:
      return {
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodUnknown } },
      }

    case z.ZodFirstPartyTypeKind.ZodNever:
      return {
        not: true,
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodNever } },
      } satisfies json.NeverSchema

    case z.ZodFirstPartyTypeKind.ZodVoid:
      throw new Error('ZodVoid is not supported')

    case z.ZodFirstPartyTypeKind.ZodArray:
      return {
        type: 'array',
        items: _toJsonSchema(def.type),
        'x-zui': def['x-zui'],
      } satisfies json.ArraySchema

    case z.ZodFirstPartyTypeKind.ZodObject:
      const shape = Object.entries(def.shape())
      const required = shape.filter(([_, value]) => !value.isOptional()).map(([key]) => key)
      return {
        type: 'object',
        properties: Object.fromEntries(shape.map(([key, value]) => [key, _toJsonSchema(value)])), // TODO: should we dedent ZodOptional values since they are already treated as optionals by the required key?
        required,
        'x-zui': def['x-zui'],
      } satisfies json.ObjectSchema

    case z.ZodFirstPartyTypeKind.ZodUnion:
      return {
        anyOf: def.options.map((option) => _toJsonSchema(option)),
        'x-zui': { ...def['x-zui'], def: { typeName: z.ZodFirstPartyTypeKind.ZodUnion } },
      } satisfies json.UnionSchema

    case z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return {
        anyOf: def.options.map((option) => _toJsonSchema(option)),
        'x-zui': {
          ...def['x-zui'],
          def: { typeName: z.ZodFirstPartyTypeKind.ZodDiscriminatedUnion, discriminator: def.discriminator },
        },
      } satisfies json.DiscriminatedUnionSchema

    case z.ZodFirstPartyTypeKind.ZodIntersection:
      return {
        allOf: [_toJsonSchema(def.left), _toJsonSchema(def.right)],
        'x-zui': def['x-zui'],
      } satisfies json.IntersectionSchema

    case z.ZodFirstPartyTypeKind.ZodTuple:
      return {
        type: 'array',
        items: def.items.map((item) => _toJsonSchema(item)),
        additionalItems: def.rest ? _toJsonSchema(def.rest) : undefined,
        'x-zui': def['x-zui'],
      } satisfies json.TupleSchema

    case z.ZodFirstPartyTypeKind.ZodRecord:
      return {
        type: 'object',
        additionalProperties: _toJsonSchema(def.valueType),
        'x-zui': def['x-zui'],
      } satisfies json.RecordSchema

    case z.ZodFirstPartyTypeKind.ZodMap:
      throw new Error('ZodMap is not supported')

    case z.ZodFirstPartyTypeKind.ZodSet:
      return {
        type: 'array',
        items: _toJsonSchema(def.valueType),
        uniqueItems: true,
        'x-zui': def['x-zui'],
      } satisfies json.SetSchema

    case z.ZodFirstPartyTypeKind.ZodFunction:
      throw new Error('ZodFunction is not supported')

    case z.ZodFirstPartyTypeKind.ZodLazy:
      throw new Error('ZodLazy is not supported')

    case z.ZodFirstPartyTypeKind.ZodLiteral:
      throw new Error('ZodLiteral is not supported')

    case z.ZodFirstPartyTypeKind.ZodEnum:
      return {
        type: 'string',
        enum: def.values,
        'x-zui': def['x-zui'],
      } satisfies json.EnumSchema

    case z.ZodFirstPartyTypeKind.ZodEffects:
      throw new Error('ZodEffects is not supported')

    case z.ZodFirstPartyTypeKind.ZodNativeEnum:
      throw new Error('ZodNativeEnum is not supported')

    case z.ZodFirstPartyTypeKind.ZodOptional:
      return {
        anyOf: [_toJsonSchema(def.innerType), undefinedSchema()],
        'x-zui': def['x-zui'],
      } satisfies json.OptionalSchema

    case z.ZodFirstPartyTypeKind.ZodNullable:
      return {
        anyOf: [_toJsonSchema(def.innerType), nullSchema()],
        'x-zui': def['x-zui'],
      } satisfies json.NullableSchema

    case z.ZodFirstPartyTypeKind.ZodDefault:
      return {
        default: def.defaultValue(),
        ..._toJsonSchema(def.innerType), // TODO: what if x-zui is set both in innerType and outerType?
      }

    case z.ZodFirstPartyTypeKind.ZodCatch:
      throw new Error('ZodCatch is not supported') // TODO: could be supported with if-else json schema

    case z.ZodFirstPartyTypeKind.ZodPromise:
      throw new Error('ZodPromise is not supported')

    case z.ZodFirstPartyTypeKind.ZodBranded:
      throw new Error('ZodBranded is not supported')

    case z.ZodFirstPartyTypeKind.ZodPipeline:
      throw new Error('ZodPipeline is not supported')

    case z.ZodFirstPartyTypeKind.ZodSymbol:
      throw new Error('ZodPipeline is not supported')

    case z.ZodFirstPartyTypeKind.ZodReadonly:
      return {
        readOnly: true,
        ..._toJsonSchema(def.innerType), // TODO: what if x-zui is set both in innerType and outerType?
      }

    case z.ZodFirstPartyTypeKind.ZodRef:
      return {
        $ref: def.uri,
        'x-zui': def['x-zui'],
      }

    default:
      z.util.assertNever(def)
  }
}
