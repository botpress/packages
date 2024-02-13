import * as types from './typings'
import { jexEquals } from './jex-equals'

type LiteralOf<T extends types.JexPrimitive> = Extract<types.JexLiteral, { type: T['type'] }>

export type JexFailureReason = {
  message: string
  child: JexFailureReason[]
}

export type JexSuccessResult = {
  result: true
}

export type JexFailureResult = {
  result: false
  reason: JexFailureReason
}

export type JexExtensionResult = JexSuccessResult | JexFailureResult

const _isFailure = (result: JexExtensionResult): result is JexFailureResult => !result.result

const _primitiveExtends = <T extends types.JexPrimitive>(
  child: T | LiteralOf<T>,
  parent: types.JexType
): JexExtensionResult => {
  const isT = (x: types.JexType): x is T | LiteralOf<T> => x.type === child.type
  if (!isT(parent)) {
    return { result: false, reason: { message: `"${child.type}" does not extend "${parent.type}"`, child: [] } }
  }

  type Primitive = LiteralOf<T> | (T & { value: undefined })
  const asPrimitive = (value: T | LiteralOf<T>): Primitive =>
    'value' in value ? value : { ...value, value: undefined }

  const _child = asPrimitive(child)
  const _parent = asPrimitive(parent)

  if (_parent.value !== undefined) {
    if (_child.value === undefined) {
      return {
        result: false,
        reason: { message: `"${child.type}" does not extend literal "${parent.value}"`, child: [] }
      }
    }

    if (_parent.value !== _child.value) {
      return {
        result: false,
        reason: { message: `literal "${_child.value}" does not extend literal "${parent.value}"`, child: [] }
      }
    }
  }

  return { result: true }
}

export const jexExtends = (child: types.JexType, parent: types.JexType): JexExtensionResult => {
  if (parent.type === 'any' || child.type === 'any') {
    return { result: true }
  }

  if (child.type === 'union') {
    const childExtensions = child.anyOf.map((c) => jexExtends(c, parent))
    const result = childExtensions.every((c) => c.result)
    if (result) {
      return { result: true }
    }

    const failures = childExtensions.filter(_isFailure)
    return {
      result: false,
      reason: { message: 'some of child union do not extend parent', child: failures.map((f) => f.reason) }
    }
  }

  if (parent.type === 'union') {
    const parentExtensions = parent.anyOf.map((p) => jexExtends(child, p))
    const result = parentExtensions.some((p) => p.result)
    if (result) {
      return { result: true }
    }
    const failures = parentExtensions.filter(_isFailure)
    return {
      result: false,
      reason: { message: 'child does not extend any parent union', child: failures.map((f) => f.reason) }
    }
  }

  if (child.type === 'object') {
    if (parent.type === 'map') {
      const childExtensions = Object.values(child.properties).map((c) => jexExtends(c, parent.items))
      const result = childExtensions.every((c) => c.result)
      if (result) {
        return { result: true }
      }
      const failures = childExtensions.filter(_isFailure)
      return {
        result: false,
        reason: { message: 'some of child properties do not extend parent value', child: failures.map((f) => f.reason) }
      }
    }

    if (parent.type === 'object') {
      const parentExtensions: JexExtensionResult[] = Object.entries(parent.properties).map(([key, parentValue]) => {
        const childValue = child.properties[key]
        if (childValue === undefined) {
          return { result: false, reason: { message: `child does not have property "${key}"`, child: [] } }
        }
        return jexExtends(childValue, parentValue)
      })

      const result = parentExtensions.every((p) => p.result)
      if (result) {
        return { result: true }
      }

      const failures = parentExtensions.filter(_isFailure)
      return {
        result: false,
        reason: {
          message: 'some of child properties are either missing or do not extend parent properties',
          child: failures.map((f) => f.reason)
        }
      }
    }

    return { result: false, reason: { message: `"${child.type}" does not extend "${parent.type}"`, child: [] } }
  }

  if (child.type === 'map') {
    if (parent.type !== 'map') {
      return { result: false, reason: { message: `"${child.type}" does not extend "${parent.type}"`, child: [] } }
    }
    return jexExtends(child.items, parent.items)
  }

  if (child.type === 'tuple') {
    if (parent.type === 'array') {
      const childExtensions = child.items.map((c) => jexExtends(c, parent.items))
      const result = childExtensions.every((c) => c.result)
      if (result) {
        return { result: true }
      }
      const failures = childExtensions.filter(_isFailure)
      return {
        result: false,
        reason: { message: 'some of child items do not extend parent items', child: failures.map((f) => f.reason) }
      }
    }
    if (parent.type === 'tuple') {
      const zipped = child.items.map(
        (c, i) => [c, parent.items[i]] satisfies [types.JexType, types.JexType | undefined]
      )

      const extensions: JexExtensionResult[] = zipped.map(([c, p]) => {
        if (p === undefined) {
          // if parent tuple is shorter than child tuple, it is still valid
          return { result: true }
        }
        return jexExtends(c, p)
      })

      const result = extensions.every((e) => e.result)
      if (result) {
        return { result: true }
      }

      const failures = extensions.filter(_isFailure)
      return {
        result: false,
        reason: { message: 'some of child items do not extend parent items', child: failures.map((f) => f.reason) }
      }
    }

    return { result: false, reason: { message: `"${child.type}" does not extend "${parent.type}"`, child: [] } }
  }

  if (child.type === 'array') {
    if (parent.type !== 'array') {
      return { result: false, reason: { message: `"${child.type}" does not extend "${parent.type}"`, child: [] } }
    }
    return jexExtends(child.items, parent.items)
  }

  if (child.type === 'string' || child.type === 'number' || child.type === 'boolean') {
    return _primitiveExtends(child, parent)
  }

  const result = jexEquals(child, parent)
  if (result) {
    return { result: true }
  }
  const reason = { message: `"${child.type}" does not extend "${parent.type}"`, child: [] }
  return { result: false, reason }
}
