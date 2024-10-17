import _ from 'lodash'
import * as utils from '../../utils'
import * as types from '../typings'
import { JexIR } from '../typings'

export type TraverseJexIRCallback = (node: JexIR) => JexIR

/**
 * Traverse a JexIR schema in Post-Order and apply a callback to each node.
 * See https://en.wikipedia.org/wiki/Tree_traversal#Post-order,_LRN
 *
 * @param schema the schema to traverse
 * @param cb the callback to apply to each node
 * @returns a new schema with the callback applied to each node
 */
export const traverseJexIRPostOrder = (schema: JexIR, cb: TraverseJexIRCallback): JexIR => {
  if (schema.type === 'array') {
    const newSchema: JexIR = { ...schema, items: traverseJexIRPostOrder(schema.items, cb) }
    return cb(newSchema)
  }

  if (schema.type === 'tuple') {
    const newSchema: JexIR = { ...schema, items: schema.items.map((item) => traverseJexIRPostOrder(item, cb)) }
    return cb(newSchema)
  }

  if (schema.type === 'map') {
    const newSchema: JexIR = { ...schema, items: traverseJexIRPostOrder(schema.items, cb) }
    return cb(newSchema)
  }

  if (schema.type === 'object') {
    const newSchema: JexIR = {
      ...schema,
      properties: _.mapValues(schema.properties, (v) => traverseJexIRPostOrder(v, cb))
    }
    return cb(newSchema)
  }

  if (schema.type === 'union') {
    const newSchema: JexIR = { ...schema, anyOf: schema.anyOf.map((item) => traverseJexIRPostOrder(item, cb)) }
    return cb(newSchema)
  }

  if (schema.type === 'intersection') {
    const newSchema: JexIR = { ...schema, allOf: schema.allOf.map((item) => traverseJexIRPostOrder(item, cb)) }
    return cb(newSchema)
  }

  // so that we don't forget a level of recursion
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof schema, types.JexIRBaseType>>
  return cb(schema)
}

/**
 * Traverse a JexIR schema in Pre-Order and apply a callback to each node.
 * See https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR
 *
 * @param schema the schema to traverse
 * @param cb the callback to apply to each node
 * @returns a new schema with the callback applied to each node
 */
export const traverseJexIRPreOrder = (oldSchema: JexIR, cb: TraverseJexIRCallback): JexIR => {
  const schema = cb(oldSchema)

  if (schema.type === 'array') {
    return { ...schema, items: traverseJexIRPreOrder(schema.items, cb) }
  }

  if (schema.type === 'tuple') {
    return { ...schema, items: schema.items.map((item) => traverseJexIRPreOrder(item, cb)) }
  }

  if (schema.type === 'map') {
    return { ...schema, items: traverseJexIRPreOrder(schema.items, cb) }
  }

  if (schema.type === 'object') {
    return {
      ...schema,
      properties: _.mapValues(schema.properties, (v) => traverseJexIRPreOrder(v, cb))
    }
  }

  if (schema.type === 'union') {
    return { ...schema, anyOf: schema.anyOf.map((item) => traverseJexIRPreOrder(item, cb)) }
  }

  if (schema.type === 'intersection') {
    return { ...schema, allOf: schema.allOf.map((item) => traverseJexIRPreOrder(item, cb)) }
  }

  // so that we don't forget a level of recursion
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof schema, types.JexIRBaseType>>
  return cb(schema)
}
