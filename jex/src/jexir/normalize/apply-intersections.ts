import _ from 'lodash'
import * as types from '../typings'
import { traverseJexIRPreOrder } from './traverse-jexir'

const mergeObjects = (objectA: types.JexIRObject, objectB: types.JexIRObject): types.JexIRObject => {
  const objectC: types.JexIRObject = { type: 'object', properties: {} }
  const keysA = Object.keys(objectA.properties)
  const keysB = Object.keys(objectB.properties)
  const allKeys = new Set([...keysA, ...keysB])
  for (const key of allKeys) {
    const propA = objectA.properties[key]
    const propB = objectB.properties[key]
    if (propA && propB) {
      objectC.properties[key] = { type: 'intersection', allOf: [propA, propB] }
    } else if (propA) {
      objectC.properties[key] = propA
    } else if (propB) {
      objectC.properties[key] = propB
    }
  }
  return objectC
}

/**
 *
 * Consider two types T1 and T2:
 * type T1 = { a: A } & { b: B } & { c: C } & { d: D }
 * type T2 = { a: A, b: B, c: C, d: D }
 * Both types are equivalent, but T1 is in an intersected form, while T2 is not.
 *
 * @param schema a JexIR schema
 * @returns a new JexIR schema with intersections applied
 */
export const applyIntersections = (s: types.JexIR): types.JexIR =>
  traverseJexIRPreOrder(s, (s: types.JexIR): types.JexIR => {
    if (s.type !== 'intersection') {
      return s
    }

    const [objects, others] = _.partition(s.allOf, (s) => s.type === 'object')
    if (objects.length === 0) {
      return s
    }

    let mergedObject: types.JexIRObject = { type: 'object', properties: {} }
    for (const object of objects) {
      mergedObject = mergeObjects(mergedObject, object)
    }

    if (others.length === 0) {
      return mergedObject
    }

    return {
      ...s,
      allOf: [...others, mergedObject]
    }
  })
