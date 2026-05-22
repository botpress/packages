import * as semver from 'semver'

/**
 * @param versionOrRange a semver version or range like `1.2.3`, `^1.2.3`, `~1.2.3`, `>=1.2.3 <2.0.0-0`
 * @returns the lower bound of the version or range
 */
export const getLowerBound = (versionOrRange: string): string | null => {
  try {
    const min = semver.minVersion(versionOrRange)
    if (!min) {
      return null
    }
    return min.version
  } catch {
    return null
  }
}

const _isNonEmpty = <T>(arr: readonly T[]): arr is readonly [T, ...T[]] => arr.length > 0

/**
 *
 * @param currentVersionOrRange a semver version or range like `1.2.3`, `^1.2.3`, `~1.2.3`, `>=1.2.3 <2.0.0-0`
 * @param newLowerBound the new lower bound version to bump to
 * @returns the updated version or range with the new lower bound or the original input if it cannot be bumped
 */
export const attemptBumpLowerbound = (currentVersionOrRange: string, newLowerBound: string): string => {
  if (semver.valid(currentVersionOrRange)) {
    return newLowerBound
  }

  if (currentVersionOrRange.startsWith('^') || currentVersionOrRange.startsWith('~')) {
    const operator = currentVersionOrRange[0]
    return `${operator}${newLowerBound}`
  }

  const range = new semver.Range(currentVersionOrRange)
  const comparatorsUnion = range.set

  if (!_isNonEmpty(comparatorsUnion)) {
    return newLowerBound
  }

  if (comparatorsUnion.length > 1) {
    return newLowerBound // does not support complex ranges with || operators (e.g., ">=1.2.3 <2.0.0 || >=3.0.0")
  }

  const comparatorsIntersection = comparatorsUnion[0]

  if (!_isNonEmpty(comparatorsIntersection)) {
    return newLowerBound // should not happen
  }

  if (comparatorsIntersection.length > 2) {
    return newLowerBound // does not support complex ranges with more than two comparators (e.g., ">=1.2.3 <1.3.0 <=1.2.999")
  }

  // here we know we have something like ">=1.2.3" or ">=1.2.3 <2.0.0-0"

  if (!semver.satisfies(newLowerBound, currentVersionOrRange)) {
    return newLowerBound // new lower bound is higher than the current range
  }

  const newComparators = comparatorsIntersection.map((comp) => {
    if (comp.operator === '>=' || comp.operator === '>') {
      return new semver.Comparator(`${comp.operator}${newLowerBound}`)
    }
    return comp
  })

  const newRange = new semver.Range(newComparators.map((c) => c.value).join(' '))
  return newRange.format()
}
