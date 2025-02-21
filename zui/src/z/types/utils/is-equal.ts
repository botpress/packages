import * as lodash from 'lodash-es'

/** Sadly, this type is not exported by lodash, so we must redefine it */
type IsEqualCustomizer = (
  value: any,
  other: any,
  indexOrKey: PropertyKey | undefined,
  parent: any,
  otherParent: any,
  stack: any,
) => boolean | undefined

export const isEqual = (a: any, b: any): boolean => lodash.isEqualWith(a, b, _customizer)

const _alreadyChecked = Symbol('infinite recursion prevention')

const _customizer: IsEqualCustomizer = (a, b) => {
  if (lodash.isPlainObject(a) && !a[_alreadyChecked] && lodash.isPlainObject(b) && !b[_alreadyChecked]) {
    const cleanedA = lodash.omitBy(a, lodash.isUndefined)
    const cleanedB = lodash.omitBy(b, lodash.isUndefined)

    // Prevent infinite recursion: mark objects as already checked:
    Object.defineProperty(cleanedA, _alreadyChecked, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    })
    Object.defineProperty(cleanedB, _alreadyChecked, {
      value: true,
      enumerable: false,
      configurable: false,
      writable: false,
    })

    return isEqual(cleanedA, cleanedB)
  }

  return undefined // Offload to default lodash isEqual comparison
}
