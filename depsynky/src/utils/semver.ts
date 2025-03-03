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
