import * as types from './typings'
import { jexExtends } from './jex-extends'
import { expect, test } from 'vitest'

const expectJex = (jexType: types.JexType) => ({
  not: {
    toExtend: (parent: types.JexType) => {
      const actual = jexExtends(jexType, parent)
      expect(actual).toBe(false)
    }
  },
  toExtend: (parent: types.JexType) => {
    const actual = jexExtends(jexType, parent)
    expect(actual).toBe(true)
  }
})

test('jex-extends should be true if child or parent is any', () => {
  expectJex({ type: 'any' }).toExtend({ type: 'any' })
  expectJex({ type: 'string' }).toExtend({ type: 'any' })
  expectJex({ type: 'any' }).toExtend({ type: 'string' })
})

test('jex-extends should be true if child and parent are the same', () => {
  expectJex({ type: 'string' }).toExtend({ type: 'string' })
  expectJex({ type: 'number' }).toExtend({ type: 'number' })
  expectJex({ type: 'boolean' }).toExtend({ type: 'boolean' })
  expectJex({ type: 'null' }).toExtend({ type: 'null' })
  expectJex({ type: 'undefined' }).toExtend({ type: 'undefined' })
  expectJex({
    type: 'object',
    properties: {
      a: { type: 'string' }
    }
  }).toExtend({
    type: 'object',
    properties: {
      a: { type: 'string' }
    }
  })
  expectJex({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  }).toExtend({
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  })
})

test('jex-extends should be true if child is an object with more properties than parent', () => {
  const child: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'string' },
      b: { type: 'number' }
    }
  }

  const parent: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'string' }
    }
  }

  expectJex(child).toExtend(parent)
})

test('jex-extends should be false if child is an object with less properties than parent', () => {
  const child: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'string' }
    }
  }

  const parent: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'string' },
      b: { type: 'number' }
    }
  }

  expectJex(child).not.toExtend(parent)
})

test('jex-extends should be false if an optional property of child is required in parent', () => {
  const child: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'union', anyOf: [{ type: 'string' }, { type: 'undefined' }] }
    }
  }

  const parent: types.JexType = {
    type: 'object',
    properties: {
      a: { type: 'string' }
    }
  }

  expectJex(child).not.toExtend(parent)
})

test('jex-extends should be true child is a union with more types than parent', () => {
  const child: types.JexType = {
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  }

  const parent: types.JexType = {
    type: 'union',
    anyOf: [{ type: 'string' }]
  }

  expectJex(child).toExtend(parent)
})

test('jex-extends should be false child is a union with less types than parent', () => {
  const child: types.JexType = {
    type: 'union',
    anyOf: [{ type: 'string' }]
  }

  const parent: types.JexType = {
    type: 'union',
    anyOf: [{ type: 'string' }, { type: 'number' }]
  }

  expectJex(child).not.toExtend(parent)
})
