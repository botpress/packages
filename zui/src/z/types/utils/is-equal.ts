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

const _customizer: IsEqualCustomizer = (value, other) => {
  if (
    lodash.isPlainObject(value) &&
    !value[_alreadyChecked] &&
    lodash.isPlainObject(other) &&
    !other[_alreadyChecked]
  ) {
    // Prevent infinite recursion: mark objects as already checked:
    value[_alreadyChecked] = true
    other[_alreadyChecked] = true

    return isEqual(lodash.omitBy(value, lodash.isUndefined), lodash.omitBy(other, lodash.isUndefined))
  }

  return undefined // Offload to default lodash isEqual comparison
}
