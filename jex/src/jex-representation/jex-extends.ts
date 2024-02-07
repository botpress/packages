import * as types from './typings'
import { JexSet, jexEquals } from './jex-equals'

export const jexExtends = (child: types.JexType, parent: types.JexType): boolean => {
  if (parent.type === 'any') return true
  if (child.type === 'any') return true

  const areEqual = jexEquals(child, parent)
  if (areEqual) return true

  if (child.type === 'object') {
    if (parent.type !== 'object') return false
    for (const [key, parentValue] of Object.entries(parent.properties)) {
      const childValue = child.properties[key]
      if (!childValue) return false
      if (!jexExtends(childValue, parentValue)) return false
    }
    return true
  }

  if (child.type === 'union') {
    if (parent.type !== 'union') return false
    const childProps = new JexSet(child.anyOf)
    const parentProps = new JexSet(parent.anyOf)
    return parentProps.isSubsetOf(childProps) // parentProps ⊆ childProps
  }

  return false
}
