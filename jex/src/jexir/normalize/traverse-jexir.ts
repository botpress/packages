import _ from 'lodash'
import * as utils from '../../utils'
import * as types from '../typings'
import { JexIR } from '../typings'

export type TraverseJexIRCallback = (node: JexIR) => JexIR

/**
 * Traverse a JexIR schema and apply a callback to each node.
 *
 * @param schema the schema to traverse
 * @param cb the callback to apply to each node
 * @returns a new schema with the callback applied to each node
 */
export const traverseJexIR = (schema: JexIR, cb: TraverseJexIRCallback): JexIR => {
  if (schema.type === 'array') {
    const newSchema: JexIR = { ...schema, items: traverseJexIR(schema.items, cb) }
    return cb(newSchema)
  }

  if (schema.type === 'tuple') {
    const newSchema: JexIR = { ...schema, items: schema.items.map((item) => traverseJexIR(item, cb)) }
    return cb(newSchema)
  }

  if (schema.type === 'map') {
    const newSchema: JexIR = { ...schema, items: traverseJexIR(schema.items, cb) }
    return cb(newSchema)
  }

  if (schema.type === 'object') {
    const newSchema: JexIR = {
      ...schema,
      properties: _.mapValues(schema.properties, (v) => traverseJexIR(v, cb))
    }
    return cb(newSchema)
  }

  if (schema.type === 'union') {
    const newSchema: JexIR = { ...schema, anyOf: schema.anyOf.map((item) => traverseJexIR(item, cb)) }
    return cb(newSchema)
  }

  if (schema.type === 'intersection') {
    const newSchema: JexIR = { ...schema, allOf: schema.allOf.map((item) => traverseJexIR(item, cb)) }
    return cb(newSchema)
  }

  // so that we don't forget a level of recursion
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof schema, types.JexIRBaseType>>
  return cb(schema)
}
