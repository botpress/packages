import * as types from '../typings'
import { traverseJexIRPostOrder } from './traverse-jexir'

/**
 *
 * Consider two sets S1 and S2:
 * type S1 = A | (B | (C | D))
 * type S2 = A | B | C | D
 * Both sets are equivalent, but S1 is not in a flattened form.
 * This function takes a schema and returns a new schema with all unions flattened to the top level.
 *
 * @param schema a JexIR schema
 * @returns a new JexIR schema with all unions flattened
 */
export const flattenUnions = (s: types.JexIR): types.JexIR =>
  traverseJexIRPostOrder(s, (s: types.JexIR): types.JexIR => {
    if (s.type !== 'union') {
      return s
    }

    const anyOf: types.JexIR[] = []
    for (const item of s.anyOf) {
      if (item.type === 'union') {
        anyOf.push(...item.anyOf)
      } else {
        anyOf.push(item)
      }
    }

    return {
      type: 'union',
      anyOf
    }
  })
