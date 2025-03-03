import * as semver from './semver'
import { test, expect } from 'vitest'

test('getLowerBound', () => {
  expect(semver.getLowerBound('banana')).toEqual(null)
  expect(semver.getLowerBound('1.2.3')).toEqual('1.2.3')
  expect(semver.getLowerBound('^1.2.3')).toEqual('1.2.3')
  expect(semver.getLowerBound('~1.2.3')).toEqual('1.2.3')
  expect(semver.getLowerBound('>=1.2.3 <2.0.0-0')).toEqual('1.2.3')
  expect(semver.getLowerBound('>=1.2.3 <1.2.4')).toEqual('1.2.3')
})
