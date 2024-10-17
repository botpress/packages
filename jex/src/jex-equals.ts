import * as jexir from './jexir'
import * as utils from './utils'
import _ from 'lodash'

class JexSet extends utils.collection.CustomSet<jexir.JexIR> {
  public constructor(items: jexir.JexIR[] = []) {
    super(items, { compare: _jexEquals })
  }
}

const _jexEquals = (a: jexir.JexIR, b: jexir.JexIR): boolean => {
  if (a.type === 'array') {
    if (b.type !== 'array') {
      return false
    }
    return _jexEquals(a.items, b.items)
  }

  if (a.type === 'tuple') {
    if (b.type !== 'tuple') {
      return false
    }
    const zipped = _.zip(a.items, b.items)
    return zipped.every(([aItem, bItem]) => {
      if (aItem === undefined || bItem === undefined) {
        return false
      }
      return _jexEquals(aItem, bItem)
    })
  }

  if (a.type === 'map') {
    if (b.type !== 'map') {
      return false
    }
    return _jexEquals(a.items, b.items)
  }

  if (a.type === 'object') {
    if (b.type !== 'object') {
      return false
    }
    const aKeys = new utils.collection.CustomSet<string>(Object.keys(a.properties))
    const bKeys = new utils.collection.CustomSet<string>(Object.keys(b.properties))

    if (!aKeys.isEqual(bKeys)) {
      return false
    }

    for (const aKey of aKeys.items) {
      const aValue = a.properties[aKey]!
      const bValue = b.properties[aKey]!
      if (!_jexEquals(aValue, bValue)) {
        return false
      }
    }
    return true
  }

  if (a.type === 'union') {
    if (b.type !== 'union') {
      return false
    }
    const aSet = new JexSet(a.anyOf)
    const bSet = new JexSet(b.anyOf)
    return aSet.isEqual(bSet)
  }

  if (a.type === 'intersection') {
    if (b.type !== 'intersection') {
      return false
    }
    const aSet = new JexSet(a.allOf)
    const bSet = new JexSet(b.allOf)
    return aSet.isEqual(bSet)
  }

  // so that we don't forget a level of recursion
  type _expectPrimitive = utils.types.Expect<utils.types.Equals<typeof a, jexir.JexIRBaseType>>
  return _.isEqual(a, b)
}

export const jexEquals = (typeA: jexir.JexIR, typeB: jexir.JexIR): boolean => {
  return _jexEquals(typeA, typeB)
}
