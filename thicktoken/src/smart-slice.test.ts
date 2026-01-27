import { SmartSlice } from './smart-slice'
import { test, expect } from 'vitest'

test('SmartSlice can slice the entire range', () => {
  const slice = new SmartSlice([[0, 10]], 10)
  const indices = [...slice]
  expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
})

test('SmartSlice can slice multiple ranges', () => {
  const slice = new SmartSlice(
    [
      [0, 3],
      [5, 7],
      [8, 10]
    ],
    10
  )
  const indices = [...slice]
  expect(indices).toEqual([0, 1, 2, 5, 6, 8, 9])
})

test('SmartSlice handles empty slices', () => {
  const slice = new SmartSlice([], 10)
  const indices = [...slice]
  expect(indices).toEqual([])
})

test('SmartSlice handles overlapping slices', () => {
  const slice = new SmartSlice(
    [
      [0, 5],
      [3, 8]
    ],
    10
  )
  const indices = [...slice]
  expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
})

test('SmartSlice handles out-of-bounds slices', () => {
  const slice = new SmartSlice(
    [
      [-5, 3],
      [8, 12]
    ],
    10
  )
  const indices = [...slice]
  expect(indices).toEqual([0, 1, 2, 8, 9])
})

test('SmartSlice handles single-point slices', () => {
  const slice = new SmartSlice(
    [
      [4, 5],
      [7, 8]
    ],
    10
  )
  const indices = [...slice]
  expect(indices).toEqual([4, 7])
})

test('SmartSlice sorts and merges slices correctly', () => {
  const slice = new SmartSlice(
    [
      [5, 7],
      [9, 10],
      [0, 3],
      [2, 6]
    ],
    10
  )
  const indices = [...slice]
  expect(indices).toEqual([0, 1, 2, 3, 4, 5, 6, 9])
})
