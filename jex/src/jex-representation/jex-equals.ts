import * as types from './typings'
import * as utils from '../utils'
import _ from 'lodash'

export class JexSet extends utils.collection.CustomSet<types.JexType> {
  public constructor(items: types.JexType[] = []) {
    super(items, { compare: jexEquals })
  }
}

export const jexEquals = (a: types.JexType, b: types.JexType): boolean => {
  if (a.type === 'union' && b.type === 'union') {
    const aSet = new JexSet(a.anyOf)
    const bSet = new JexSet(b.anyOf)
    return aSet.isEqual(bSet)
  }
  return _.isEqual(a, b)
}
