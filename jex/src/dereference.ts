import { JSONSchema7 } from 'json-schema'
import * as err from './errors'
import _ from 'lodash'
import { dereference, JSONParserError } from '@apidevtools/json-schema-ref-parser'

export const dereferenceJsonSchema = async (schema: JSONSchema7): Promise<JSONSchema7> => {
  try {
    const unref = await dereference(schema, {
      dereference: {
        circular: false // TODO: add support for circular references
      }
    })
    return unref as JSONSchema7
  } catch (thrown) {
    if (thrown instanceof ReferenceError) {
      const mapped = new err.JexReferenceError(thrown)
      mapped.stack = thrown.stack
      throw mapped
    }
    if (thrown instanceof JSONParserError) {
      const mapped = new err.JexParserError(thrown)
      mapped.stack = thrown.stack
      throw mapped
    }
    throw thrown
  }
}
