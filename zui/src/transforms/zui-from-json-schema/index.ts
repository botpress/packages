import { JSONSchema7, JSONSchema7Definition } from 'json-schema'
import * as errors from '../common/errors'
import * as guards from './guards'
import z from '../../z'
import { toZuiPrimitive } from './primitives'
import { arrayJSONSchemaToZuiArray } from './iterables/array'
import { ArraySchema, SetSchema, TupleSchema } from '../common/json-schema'
import { zuiKey } from '../../ui/constants'

const DEFAULT_TYPE = z.any()

/**
 * Converts a JSON Schema to a ZUI Schema.
 * @param schema json schema
 * @returns ZUI Schema
 */
export function fromJSONSchema(schema: JSONSchema7): z.ZodType {
  const zuiSchema = _fromJSONSchema(schema)
  applyZuiPropsRecursively(zuiSchema, schema)
  return zuiSchema
}

function _fromJSONSchema(schema: JSONSchema7Definition | undefined): z.ZodType {
  if (schema === undefined) {
    return DEFAULT_TYPE
  }

  if (schema === true) {
    return z.any()
  }

  if (schema === false) {
    return z.never()
  }

  if (schema.default !== undefined) {
    const inner = _fromJSONSchema({ ...schema, default: undefined })
    return inner.default(schema.default)
  }
  if (schema.readOnly) {
    const inner = _fromJSONSchema({ ...schema, readOnly: undefined })
    return inner.readonly()
  }

  if (schema.oneOf !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ oneOf: schema.oneOf })
  }

  if (schema.patternProperties !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ patternProperties: schema.patternProperties })
  }

  if (schema.propertyNames !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ propertyNames: schema.propertyNames })
  }

  if (schema.if !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ if: schema.if })
  }

  if (schema.then !== undefined) {
    // eslint-disable-next-line no-thenable
    throw new errors.UnsupportedJSONSchemaToZuiError({ then: schema.then })
  }

  if (schema.else !== undefined) {
    throw new errors.UnsupportedJSONSchemaToZuiError({ else: schema.else })
  }

  if (schema.$ref !== undefined) {
    return z.ref(schema.$ref)
  }

  if (schema.not !== undefined) {
    if (guards.isUndefinedSchema(schema)) {
      return z.undefined()
    }
    if (schema.not === true) {
      return z.never()
    }
    throw new errors.UnsupportedJSONSchemaToZuiError({ not: schema.not })
  }

  if (Array.isArray(schema.type)) {
    if (schema.type.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.type.length === 1) {
      return _fromJSONSchema({ ...schema, type: schema.type[0] })
    }
    const { type: _, ...tmp } = schema
    const types = schema.type.map((t) => _fromJSONSchema({ ...tmp, type: t })) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(types)
  }

  if (schema.type === 'string') {
    if (schema.enum && schema.enum.length > 0) {
      return z.enum(schema.enum as [string, ...string[]])
    }
    return toZuiPrimitive('string', schema)
  }

  if (schema.type === 'integer') {
    const zSchema = toZuiPrimitive('number', schema)
    if (zSchema instanceof z.ZodNumber) {
      return zSchema.int()
    }

    return zSchema
  }

  if (schema.type === 'number') {
    return toZuiPrimitive('number', schema)
  }

  if (schema.type === 'boolean') {
    return toZuiPrimitive('boolean', schema)
  }

  if (schema.type === 'null') {
    return toZuiPrimitive('null', schema)
  }

  if (schema.type === 'array') {
    return arrayJSONSchemaToZuiArray(schema as ArraySchema | TupleSchema | SetSchema, _fromJSONSchema)
  }

  if (schema.type === 'object') {
    if (schema.additionalProperties !== undefined && schema.properties !== undefined) {
      const catchAll = _fromJSONSchema(schema.additionalProperties)
      const inner = _fromJSONSchema({ ...schema, additionalProperties: undefined }) as z.ZodObject
      return inner.catchall(catchAll)
    }

    if (schema.properties !== undefined) {
      const properties: Record<string, z.ZodType> = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        const mapped: z.ZodType = _fromJSONSchema(value)
        const required: string[] = schema.required ?? []
        properties[key] = required.includes(key) ? mapped : mapped.optional()
      }
      return z.object(properties)
    }

    if (schema.additionalProperties !== undefined) {
      const inner = _fromJSONSchema(schema.additionalProperties)
      return z.record(inner)
    }

    return z.record(DEFAULT_TYPE)
  }

  if (schema.anyOf !== undefined) {
    if (schema.anyOf.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.anyOf.length === 1) {
      return _fromJSONSchema(schema.anyOf[0])
    }

    if (guards.isOptionalSchema(schema)) {
      const inner = _fromJSONSchema(schema.anyOf[0])
      return inner.optional()
    }

    if (guards.isNullableSchema(schema)) {
      const inner = _fromJSONSchema(schema.anyOf[0])
      return inner.nullable()
    }

    const options = schema.anyOf.map(_fromJSONSchema) as [z.ZodType, z.ZodType, ...z.ZodType[]]
    return z.union(options)
  }

  if (schema.allOf !== undefined) {
    if (schema.allOf.length === 0) {
      return DEFAULT_TYPE
    }
    if (schema.allOf.length === 1) {
      return _fromJSONSchema(schema.allOf[0])
    }
    const [left, ...right] = schema.allOf as [JSONSchema7, ...JSONSchema7[]]
    const zLeft = _fromJSONSchema(left)
    const zRight = _fromJSONSchema({ allOf: right })
    return z.intersection(zLeft, zRight)
  }

  type _expectUndefined = z.util.AssertTrue<z.util.IsEqual<typeof schema.type, undefined>>

  if (guards.isUnknownSchema(schema)) {
    return z.unknown()
  }
  return DEFAULT_TYPE
}

function applyZuiPropsRecursively(zodField: z.ZodTypeAny, jsonSchemaField: any) {
  if (jsonSchemaField[zuiKey] && zodField._def) {
    if (zodField._def.typeName === 'ZodOptional') {
      zodField._def.innerType._def[zuiKey] = jsonSchemaField[zuiKey]
    } else {
      zodField._def[zuiKey] = jsonSchemaField[zuiKey]
    }
  }

  if (jsonSchemaField.description && zodField._def) {
    if (zodField._def.typeName === 'ZodOptional') {
      zodField._def.innerType._def.description = jsonSchemaField.description
    } else {
      zodField._def.description = jsonSchemaField.description
    }
  }

  if (zodField._def?.typeName === 'ZodObject' && jsonSchemaField.type === 'object' && jsonSchemaField.properties) {
    Object.entries(jsonSchemaField.properties).forEach(([key, nestedField]) => {
      const shape = typeof zodField._def.shape === 'function' ? zodField._def.shape() : zodField._def.shape

      if (shape[key]) {
        applyZuiPropsRecursively(shape[key], nestedField)
      }
    })
  }

  if (
    zodField._def?.typeName === 'ZodRecord' &&
    jsonSchemaField.type === 'object' &&
    jsonSchemaField.additionalProperties
  ) {
    applyZuiPropsRecursively(zodField._def.valueType, jsonSchemaField.additionalProperties)
  }

  if (jsonSchemaField.type === 'array' && jsonSchemaField.items) {
    const items = jsonSchemaField.items

    if (typeof items === 'object' && !Array.isArray(items)) {
      const arrayShape = zodField._def.type

      if (arrayShape) {
        applyZuiPropsRecursively(arrayShape, items)
      }
    } else if (Array.isArray(items)) {
      items.forEach((item, index) => {
        const def: z.ZodDef = zodField._def

        if (def.typeName === z.ZodFirstPartyTypeKind.ZodTuple) {
          applyZuiPropsRecursively(def.items[index]!, item)
        }
      })
    }
  }
}
