import * as types from './typings'
import * as utils from '../utils'
import _ from 'lodash'

export class JexSet extends utils.collection.CustomSet<types.JexType> {
  public constructor(items: types.JexType[] = []) {
    super(items, { compare: jexEquals })
  }
}

export const jexEquals = (a: types.JexType, b: types.JexType): boolean => {
  if (a.type === 'array' && b.type === 'array') {
    return jexEquals(a.items, b.items)
  }

  if (a.type === 'object' && b.type === 'object') {
    const aKeys = Object.keys(a.properties)
    const bKeys = Object.keys(b.properties)
    if (aKeys.length !== bKeys.length) {
      return false
    }

    if (aKeys.some((key) => !bKeys.includes(key))) {
      return false
    }

    if (bKeys.some((key) => !aKeys.includes(key))) {
      return false
    }

    for (const aKey of aKeys) {
      const aValue = a.properties[aKey]!
      const bValue = b.properties[aKey]!
      if (!jexEquals(aValue, bValue)) {
        return false
      }
    }
    return true
  }

  if (a.type === 'union' && b.type === 'union') {
    const aSet = new JexSet(a.anyOf)
    const bSet = new JexSet(b.anyOf)
    return aSet.isEqual(bSet)
  }

  return _.isEqual(a, b)
}
