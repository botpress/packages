import _ from 'lodash'
import * as types from '../typings'
import { traverseJexIRPreOrder } from './traverse-jexir'

const intersectTypes = (typeA: types.JexIR, typeB: types.JexIR): types.JexIR => {
  if (typeA.type === 'intersection' && typeB.type === 'intersection') {
    return { type: 'intersection', allOf: [...typeA.allOf, ...typeB.allOf] }
  }
  if (typeA.type === 'intersection') {
    return { type: 'intersection', allOf: [...typeA.allOf, typeB] }
  }
  if (typeB.type === 'intersection') {
    return { type: 'intersection', allOf: [typeA, ...typeB.allOf] }
  }
  return { type: 'intersection', allOf: [typeA, typeB] }
}

const mergeObjectsBinary = (objectA: types.JexIRObject, objectB: types.JexIRObject): types.JexIRObject => {
  const objectC: types.JexIRObject = { type: 'object', properties: {} }
  const keysA = Object.keys(objectA.properties)
  const keysB = Object.keys(objectB.properties)
  const allKeys = new Set([...keysA, ...keysB])
  for (const key of allKeys) {
    const propA = objectA.properties[key]
    const propB = objectB.properties[key]
    if (propA && propB) {
      objectC.properties[key] = intersectTypes(propA, propB)
    } else if (propA) {
      objectC.properties[key] = propA
    } else if (propB) {
      objectC.properties[key] = propB
    }
  }
  return objectC
}

const mergeObjects = (objects: types.JexIRObject[]): types.JexIRObject => {
  let mergedObject: types.JexIRObject = { type: 'object', properties: {} }
  for (const object of objects) {
    mergedObject = mergeObjectsBinary(mergedObject, object)
  }
  return mergedObject
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
export const applyIntersections = (schema: types.JexIR): types.JexIR =>
  traverseJexIRPreOrder(schema, (s: types.JexIR): types.JexIR => {
    if (s.type !== 'intersection') {
      return s
    }

    const [objects, others] = _.partition(s.allOf, (s) => s.type === 'object')
    if (objects.length === 0) {
      return s
    }

    const mergedObject = mergeObjects(objects)

    if (others.length === 0) {
      return mergedObject
    }

    const mergedIntersection: types.JexIRIntersection = { type: 'intersection', allOf: [mergedObject, ...others] }
    return mergedIntersection
  })
