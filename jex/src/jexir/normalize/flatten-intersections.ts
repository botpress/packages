import * as types from '../typings'
import { traverseJexIRPostOrder } from './traverse-jexir'

/**
 *
 * Consider two sets S1 and S2:
 * type S1 = A & (B & (C & D))
 * type S2 = A & B & C & D
 * Both sets are equivalent, but S1 is not in a flattened form.
 * This function takes a schema and returns a new schema with all unions flattened to the top level.
 *
 * @param schema a JexIR schema
 * @returns a new JexIR schema with all intersections flattened
 */
export const flattenIntersections = (schema: types.JexIR): types.JexIR =>
  traverseJexIRPostOrder(schema, (s) => {
    if (s.type !== 'intersection') {
      return s
    }

    const allOf: types.JexIR[] = []
    for (const item of s.allOf) {
      if (item.type === 'intersection') {
        allOf.push(...item.allOf)
      } else {
        allOf.push(item)
      }
    }

    return {
      type: 'intersection',
      allOf
    }
  })
