import * as semver from './semver'
import { test, expect } from 'vitest'

test('getLowerBound with invalid version should return null', () => {
  expect(semver.getLowerBound('banana')).toEqual(null)
})

test('getLowerBound with valid version should return the same version', () => {
  const expected = '1.2.3'
  expect(semver.getLowerBound('1.2.3')).toEqual(expected)
  expect(semver.getLowerBound('^1.2.3')).toEqual(expected)
  expect(semver.getLowerBound('~1.2.3')).toEqual(expected)
  expect(semver.getLowerBound('>=1.2.3 <2.0.0-0')).toEqual(expected)
  expect(semver.getLowerBound('>=1.2.3 <1.2.4')).toEqual(expected)
})
