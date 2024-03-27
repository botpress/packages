import { z } from 'zod'
import { parseBrandedDef } from '../../parsers/branded.js'
import { getRefs } from '../../Refs.js'
import { expect } from 'vitest'

describe('objects', () => {
  it('should be possible to use branded string', () => {
    const schema = z.string().brand<'x'>()
    const parsedSchema = parseBrandedDef(schema._def, getRefs())

    const expectedSchema = {
      type: 'string',
    }

    expect(parsedSchema).toEqual(expectedSchema)
  })
})
