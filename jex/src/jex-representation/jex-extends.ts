import * as types from './typings'
import { jexEquals } from './jex-equals'

type LiteralOf<T extends types.JexPrimitive> = Extract<types.JexLiteral, { type: T['type'] }>

const _primitiveExtends = <T extends types.JexPrimitive>(typeA: T | LiteralOf<T>, typeB: types.JexType): boolean => {
  const isT = (x: types.JexType): x is T | LiteralOf<T> => x.type === typeA.type
  if (!isT(typeB)) return false

  type Primitive = LiteralOf<T> | (T & { value: undefined })
  const asPrimitive = (value: T | LiteralOf<T>): Primitive =>
    'value' in value ? value : { ...value, value: undefined }

  const _typeA = asPrimitive(typeA)
  const _typeB = asPrimitive(typeB)

  if (_typeB.value !== undefined && _typeA.value === undefined) {
    return false
  }
  if (_typeB.value !== undefined && _typeA.value !== _typeB.value) {
    return false
  }
  return true
}

export const jexExtends = (typeA: types.JexType, typeB: types.JexType): boolean => {
  if (typeB.type === 'any' || typeA.type === 'any') {
    return true
  }

  if (typeA.type === 'union') {
    return typeA.anyOf.every((c) => jexExtends(c, typeB))
  }

  if (typeB.type === 'union') {
    return typeB.anyOf.some((p) => jexExtends(typeA, p))
  }

  if (typeA.type === 'object') {
    if (typeB.type === 'map') {
      return Object.values(typeA.properties).every((c) => jexExtends(c, typeB.items))
    }
    if (typeB.type === 'object') {
      return Object.entries(typeB.properties).every(([key, valueB]) => {
        const valueA = typeA.properties[key]
        if (valueA === undefined) return false
        return jexExtends(valueA, valueB)
      })
    }
    return false
  }

  if (typeA.type === 'map') {
    if (typeB.type !== 'map') return false
    return jexExtends(typeA.items, typeB.items)
  }

  if (typeA.type === 'tuple') {
    if (typeB.type === 'array') {
      return typeA.items.every((c) => jexExtends(c, typeB.items))
    }
    if (typeB.type === 'tuple') {
      const zipped = typeA.items.map((c, i) => [c, typeB.items[i]] satisfies [types.JexType, types.JexType | undefined])
      return zipped.every(([c, p]) => p === undefined || jexExtends(c, p))
    }
    return false
  }

  if (typeA.type === 'array') {
    if (typeB.type !== 'array') return false
    return jexExtends(typeA.items, typeB.items)
  }

  if (typeA.type === 'string' || typeA.type === 'number' || typeA.type === 'boolean') {
    return _primitiveExtends(typeA, typeB)
  }

  return jexEquals(typeA, typeB)
}
