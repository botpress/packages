import { ZodFirstPartyTypeKind, ZodTypeDef } from '../../z/index'
import { JsonSchema7AnyType, parseAnyDef } from './parsers/any'
import { JsonSchema7ArrayType, parseArrayDef } from './parsers/array'
import { JsonSchema7BigintType, parseBigintDef } from './parsers/bigint'
import { JsonSchema7BooleanType, parseBooleanDef } from './parsers/boolean'
import { parseBrandedDef } from './parsers/branded'
import { parseCatchDef } from './parsers/catch'
import { JsonSchema7DateType, parseDateDef } from './parsers/date'
import { parseDefaultDef } from './parsers/default'
import { parseEffectsDef } from './parsers/effects'
import { JsonSchema7EnumType, parseEnumDef } from './parsers/enum'
import { JsonSchema7AllOfType, parseIntersectionDef } from './parsers/intersection'
import { JsonSchema7LiteralType, parseLiteralDef } from './parsers/literal'
import { JsonSchema7MapType, parseMapDef } from './parsers/map'
import { JsonSchema7NativeEnumType, parseNativeEnumDef } from './parsers/nativeEnum'
import { JsonSchema7NeverType, parseNeverDef } from './parsers/never'
import { JsonSchema7NullType, parseNullDef } from './parsers/null'
import { JsonSchema7NullableType, parseNullableDef } from './parsers/nullable'
import { JsonSchema7NumberType, parseNumberDef } from './parsers/number'
import { JsonSchema7ObjectType, parseObjectDef } from './parsers/object'
import { parseOptionalDef } from './parsers/optional'
import { parsePipelineDef } from './parsers/pipeline'
import { parsePromiseDef } from './parsers/promise'
import { JsonSchema7RecordType, parseRecordDef } from './parsers/record'
import { JsonSchema7SetType, parseSetDef } from './parsers/set'
import { JsonSchema7StringType, parseStringDef } from './parsers/string'
import { JsonSchema7TupleType, parseTupleDef } from './parsers/tuple'
import { JsonSchema7UndefinedType, parseUndefinedDef } from './parsers/undefined'
import { JsonSchema7UnionType, parseUnionDef } from './parsers/union'
import { JsonSchema7UnknownType, parseUnknownDef } from './parsers/unknown'
import { Refs, Seen } from './Refs'
import { parseReadonlyDef } from './parsers/readonly'
import { zuiKey } from '../../ui/constants'
import { JsonSchema7RefType, parseRefDef } from './parsers/ref'

type JsonSchema7Meta = {
  default?: any
  description?: string
  markdownDescription?: string
}

export type JsonSchema7TypeUnion =
  | JsonSchema7StringType
  | JsonSchema7ArrayType
  | JsonSchema7NumberType
  | JsonSchema7BigintType
  | JsonSchema7BooleanType
  | JsonSchema7DateType
  | JsonSchema7EnumType
  | JsonSchema7LiteralType
  | JsonSchema7NativeEnumType
  | JsonSchema7NullType
  | JsonSchema7NumberType
  | JsonSchema7ObjectType
  | JsonSchema7RecordType
  | JsonSchema7TupleType
  | JsonSchema7UnionType
  | JsonSchema7UndefinedType
  | JsonSchema7RefType
  | JsonSchema7NeverType
  | JsonSchema7MapType
  | JsonSchema7AnyType
  | JsonSchema7NullableType
  | JsonSchema7AllOfType
  | JsonSchema7UnknownType
  | JsonSchema7SetType

export type JsonSchema7Type = JsonSchema7TypeUnion & JsonSchema7Meta

export function parseDef(
  def: ZodTypeDef,
  refs: Refs,
  forceResolution = false, // Forces a new schema to be instantiated even though its def has been seen. Used for improving refs in definitions. See https://github.com/StefanTerdell/zod-to-json-schema/pull/61.
): JsonSchema7Type | undefined {
  const seenItem = refs.seen.get(def)

  if (seenItem && !forceResolution) {
    const seenSchema = get$ref(seenItem, refs)

    if (seenSchema !== undefined) {
      return seenSchema
    }
  }

  const newItem: Seen = { def, path: refs.currentPath, jsonSchema: undefined }

  refs.seen.set(def, newItem)

  const jsonSchema = selectParser(def, def.typeName, refs)

  if (jsonSchema) {
    addMeta(def, refs, jsonSchema)
  }

  newItem.jsonSchema = jsonSchema

  return jsonSchema
}

const get$ref = (
  item: Seen,
  refs: Refs,
):
  | {
      $ref: string
    }
  | {}
  | undefined => {
  switch (refs.$refStrategy) {
    case 'root':
      return { $ref: item.path.join('/') }
    case 'relative':
      return { $ref: getRelativePath(refs.currentPath, item.path) }
    case 'none':
    case 'seen': {
      if (
        item.path.length < refs.currentPath.length &&
        item.path.every((value, index) => refs.currentPath[index] === value)
      ) {
        console.warn(`Recursive reference detected at ${refs.currentPath.join('/')}! Defaulting to any`)

        return {}
      }

      return refs.$refStrategy === 'seen' ? {} : undefined
    }
  }
}

const getRelativePath = (pathA: string[], pathB: string[]) => {
  let i = 0
  for (; i < pathA.length && i < pathB.length; i++) {
    if (pathA[i] !== pathB[i]) break
  }
  return [(pathA.length - i).toString(), ...pathB.slice(i)].join('/')
}

const selectParser = (def: any, typeName: ZodFirstPartyTypeKind, refs: Refs): JsonSchema7Type | undefined => {
  switch (typeName) {
    case ZodFirstPartyTypeKind.ZodString:
      return parseStringDef(def, refs)
    case ZodFirstPartyTypeKind.ZodNumber:
      return parseNumberDef(def, refs)
    case ZodFirstPartyTypeKind.ZodObject:
      return parseObjectDef(def, refs)
    case ZodFirstPartyTypeKind.ZodBigInt:
      return parseBigintDef(def, refs)
    case ZodFirstPartyTypeKind.ZodBoolean:
      return parseBooleanDef(def)
    case ZodFirstPartyTypeKind.ZodDate:
      return parseDateDef(def, refs)
    case ZodFirstPartyTypeKind.ZodUndefined:
      return parseUndefinedDef()
    case ZodFirstPartyTypeKind.ZodNull:
      return parseNullDef(refs)
    case ZodFirstPartyTypeKind.ZodArray:
      return parseArrayDef(def, refs)
    case ZodFirstPartyTypeKind.ZodUnion:
    case ZodFirstPartyTypeKind.ZodDiscriminatedUnion:
      return parseUnionDef(def, refs)
    case ZodFirstPartyTypeKind.ZodIntersection:
      return parseIntersectionDef(def, refs)
    case ZodFirstPartyTypeKind.ZodTuple:
      return parseTupleDef(def, refs)
    case ZodFirstPartyTypeKind.ZodRecord:
      return parseRecordDef(def, refs)
    case ZodFirstPartyTypeKind.ZodRef:
      return parseRefDef(def)
    case ZodFirstPartyTypeKind.ZodLiteral:
      return parseLiteralDef(def, refs)
    case ZodFirstPartyTypeKind.ZodEnum:
      return parseEnumDef(def)
    case ZodFirstPartyTypeKind.ZodNativeEnum:
      return parseNativeEnumDef(def)
    case ZodFirstPartyTypeKind.ZodNullable:
      return parseNullableDef(def, refs)
    case ZodFirstPartyTypeKind.ZodOptional:
      return parseOptionalDef(def, refs)
    case ZodFirstPartyTypeKind.ZodMap:
      return parseMapDef(def, refs)
    case ZodFirstPartyTypeKind.ZodSet:
      return parseSetDef(def, refs)
    case ZodFirstPartyTypeKind.ZodLazy:
      return parseDef(def.getter()._def, refs)
    case ZodFirstPartyTypeKind.ZodPromise:
      return parsePromiseDef(def, refs)
    case ZodFirstPartyTypeKind.ZodNaN:
    case ZodFirstPartyTypeKind.ZodNever:
      return parseNeverDef()
    case ZodFirstPartyTypeKind.ZodEffects:
      return parseEffectsDef(def, refs)
    case ZodFirstPartyTypeKind.ZodAny:
      return parseAnyDef()
    case ZodFirstPartyTypeKind.ZodUnknown:
      return parseUnknownDef()
    case ZodFirstPartyTypeKind.ZodDefault:
      return parseDefaultDef(def, refs)
    case ZodFirstPartyTypeKind.ZodBranded:
      return parseBrandedDef(def, refs)
    case ZodFirstPartyTypeKind.ZodReadonly:
      return parseReadonlyDef(def, refs)
    case ZodFirstPartyTypeKind.ZodCatch:
      return parseCatchDef(def, refs)
    case ZodFirstPartyTypeKind.ZodPipeline:
      return parsePipelineDef(def, refs)
    case ZodFirstPartyTypeKind.ZodFunction:
    case ZodFirstPartyTypeKind.ZodVoid:
    case ZodFirstPartyTypeKind.ZodSymbol:
      return undefined
    default:
      return ((_: never) => undefined)(typeName)
  }
}

export const addMeta = <S extends JsonSchema7Type>(def: ZodTypeDef, refs: Refs, jsonSchema: S): S => {
  if (def.description) {
    jsonSchema.description = def.description

    if (refs.markdownDescription) {
      jsonSchema.markdownDescription = def.description
    }
  }

  Object.assign(jsonSchema, { [zuiKey]: { ...def[zuiKey], ...(jsonSchema as any)[zuiKey] } })

  return jsonSchema
}
