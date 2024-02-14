import * as types from './typings'
import { jexEquals } from './jex-equals'

type LiteralOf<T extends types.JexPrimitive> = Extract<types.JexLiteral, { type: T['type'] }>

const _primitiveExtends = <T extends types.JexPrimitive>(child: T | LiteralOf<T>, parent: types.JexType): boolean => {
  const isT = (x: types.JexType): x is T | LiteralOf<T> => x.type === child.type
  if (!isT(parent)) return false

  type Primitive = LiteralOf<T> | (T & { value: undefined })
  const asPrimitive = (value: T | LiteralOf<T>): Primitive =>
    'value' in value ? value : { ...value, value: undefined }

  const _child = asPrimitive(child)
  const _parent = asPrimitive(parent)

  if (_parent.value !== undefined && _child.value === undefined) {
    return false
  }
  if (_parent.value !== undefined && _child.value !== _parent.value) {
    return false
  }
  return true
}

export const jexExtends = (child: types.JexType, parent: types.JexType): boolean => {
  if (parent.type === 'any' || child.type === 'any') {
    return true
  }

  if (child.type === 'union') {
    return child.anyOf.every((c) => jexExtends(c, parent))
  }

  if (parent.type === 'union') {
    return parent.anyOf.some((p) => jexExtends(child, p))
  }

  if (child.type === 'object') {
    if (parent.type === 'map') {
      return Object.values(child.properties).every((c) => jexExtends(c, parent.items))
    }
    if (parent.type === 'object') {
      return Object.entries(parent.properties).every(([key, parentValue]) => {
        const childValue = child.properties[key]
        if (childValue === undefined) return false
        return jexExtends(childValue, parentValue)
      })
    }
    return false
  }

  if (child.type === 'map') {
    if (parent.type !== 'map') return false
    return jexExtends(child.items, parent.items)
  }

  if (child.type === 'tuple') {
    if (parent.type === 'array') {
      return child.items.every((c) => jexExtends(c, parent.items))
    }
    if (parent.type === 'tuple') {
      const zipped = child.items.map(
        (c, i) => [c, parent.items[i]] satisfies [types.JexType, types.JexType | undefined]
      )
      return zipped.every(([c, p]) => p === undefined || jexExtends(c, p))
    }
    return false
  }

  if (child.type === 'array') {
    if (parent.type !== 'array') return false
    return jexExtends(child.items, parent.items)
  }

  if (child.type === 'string' || child.type === 'number' || child.type === 'boolean') {
    return _primitiveExtends(child, parent)
  }

  return jexEquals(child, parent)
}
