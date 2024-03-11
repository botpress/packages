import * as types from './typings'
import { PropertyPath, pathToString } from './property-path'
import { toString } from './to-string'

type _JexFailureReason = {
  path: PropertyPath
  typeA: types.JexType
  typeB: types.JexType
}
type _JexExtensionSuccess = { result: true }
type _JexExtensionFailure = { result: false; reasons: _JexFailureReason[] }
type _JexExtensionResult = _JexExtensionSuccess | _JexExtensionFailure

const _splitSuccessFailure = (results: _JexExtensionResult[]): [_JexExtensionSuccess[], _JexExtensionFailure[]] => {
  const success: _JexExtensionSuccess[] = []
  const failure: _JexExtensionFailure[] = []
  results.forEach((r) => {
    if (r.result) success.push(r)
    else failure.push(r)
  })
  return [success, failure]
}

type _LiteralOf<T extends types.JexPrimitive> = Extract<types.JexLiteral, { type: T['type'] }>
const _primitiveExtends = <T extends types.JexPrimitive>(
  path: PropertyPath,
  typeA: T | _LiteralOf<T>,
  typeB: types.JexType
): _JexExtensionResult => {
  const isT = (x: types.JexType): x is T | _LiteralOf<T> => x.type === typeA.type
  if (!isT(typeB)) {
    return {
      result: false,
      reasons: [{ path, typeA, typeB }]
    }
  }

  type Primitive = _LiteralOf<T> | (T & { value: undefined })
  const asPrimitive = (value: T | _LiteralOf<T>): Primitive =>
    'value' in value ? value : { ...value, value: undefined }

  const _typeA = asPrimitive(typeA)
  const _typeB = asPrimitive(typeB)

  if (_typeB.value !== undefined && _typeA.value === undefined) {
    return {
      result: false,
      reasons: [{ path, typeA, typeB }]
    }
  }
  if (_typeB.value !== undefined && _typeA.value !== _typeB.value) {
    return {
      result: false,
      reasons: [{ path, typeA, typeB }]
    }
  }
  return { result: true }
}

const _jexExtends = (path: PropertyPath, typeA: types.JexType, typeB: types.JexType): _JexExtensionResult => {
  if (typeB.type === 'any' || typeA.type === 'any') {
    return { result: true }
  }

  if (typeA.type === 'union') {
    const extensions = typeA.anyOf.map((c) => _jexExtends(path, c, typeB))
    const [_, failures] = _splitSuccessFailure(extensions)
    if (failures.length === 0) return { result: true } // A union all extends B
    return { result: false, reasons: failures.flatMap((f) => f.reasons) }
  }

  if (typeB.type === 'union') {
    const extensions = typeB.anyOf.map((c) => _jexExtends(path, typeA, c))
    const [success, failures] = _splitSuccessFailure(extensions)
    if (success.length > 0) return { result: true } // A extends at least one of the B union
    return { result: false, reasons: failures.flatMap((f) => f.reasons) }
  }

  if (typeA.type === 'object') {
    if (typeB.type === 'map') {
      const extensions = Object.entries(typeA.properties).map(([key, valueA]) => {
        const newPath: PropertyPath = [...path, { type: 'key', value: key }]
        return _jexExtends(newPath, valueA, typeB.items)
      })
      const [_, failures] = _splitSuccessFailure(extensions)
      if (failures.length === 0) return { result: true } // All properties of A extend B
      return { result: false, reasons: failures.flatMap((f) => f.reasons) }
    }

    if (typeB.type === 'object') {
      const extensions = Object.entries(typeB.properties).map(([key, valueB]): _JexExtensionResult => {
        const valueA = typeA.properties[key] ?? { type: 'undefined' }
        const newPath: PropertyPath = [...path, { type: 'key', value: key }]
        return _jexExtends(newPath, valueA, valueB)
      })

      const [_, failures] = _splitSuccessFailure(extensions)
      if (failures.length === 0) return { result: true } // All properties of A extend B
      return { result: false, reasons: failures.flatMap((f) => f.reasons) }
    }

    return { result: false, reasons: [{ path, typeA, typeB }] }
  }

  if (typeA.type === 'map') {
    if (typeB.type !== 'map') return { result: false, reasons: [{ path, typeA, typeB }] }

    const newPath: PropertyPath = [...path, { type: 'string-index' }]
    return _jexExtends(newPath, typeA.items, typeB.items)
  }

  if (typeA.type === 'tuple') {
    if (typeB.type === 'array') {
      const extensions = typeA.items.map((c, i) => {
        const newPath: PropertyPath = [...path, { type: 'number-index', value: i }]
        return _jexExtends(newPath, c, typeB.items)
      })
      const [_, failures] = _splitSuccessFailure(extensions)
      if (failures.length === 0) return { result: true } // All items of A extend B
      return { result: false, reasons: failures.flatMap((f) => f.reasons) }
    }
    if (typeB.type === 'tuple') {
      const zipped = typeA.items.map((c, i) => [c, typeB.items[i]] satisfies [types.JexType, types.JexType | undefined])
      const extensions = zipped.map(([c, p], i): _JexExtensionResult => {
        if (p === undefined) {
          return { result: true } // A tuple is longer than B
        }
        const newPath: PropertyPath = [...path, { type: 'number-index', value: i }]
        return _jexExtends(newPath, c, p)
      })
      const [_, failures] = _splitSuccessFailure(extensions)
      if (failures.length === 0) return { result: true } // All items of A extend B
      return { result: false, reasons: failures.flatMap((f) => f.reasons) }
    }

    return { result: false, reasons: [{ path, typeA, typeB }] }
  }

  if (typeA.type === 'array') {
    if (typeB.type !== 'array') {
      return { result: false, reasons: [{ path, typeA, typeB }] }
    }
    const newPath: PropertyPath = [...path, { type: 'number-index' }]
    return _jexExtends(newPath, typeA.items, typeB.items)
  }

  if (typeA.type === 'string' || typeA.type === 'number' || typeA.type === 'boolean') {
    return _primitiveExtends(path, typeA, typeB)
  }

  if (typeA.type !== typeB.type) {
    return { result: false, reasons: [{ path, typeA, typeB }] }
  }

  return { result: true }
}

const _reasonToString = (reason: _JexFailureReason): string =>
  `${pathToString(reason.path)}: ${toString(reason.typeA)} ⊈ ${toString(reason.typeB)}`

export type JexExtensionResult = { extends: true } | { extends: false; reasons: string[] }
export const jexExtends = (typeA: types.JexType, typeB: types.JexType): JexExtensionResult => {
  const extension = _jexExtends([], typeA, typeB)
  if (extension.result) return { extends: true }
  return { extends: false, reasons: extension.reasons.map(_reasonToString) }
}
