import { describe, it } from 'vitest'
import { z } from 'zod'
import { generateSchemaFromZod } from './jsonschema'
import { schema } from './opapi'

describe.concurrent(schema, () => {
  it('merges its OpenAPI properties over the ones the schema already carries', ({ expect }) => {
    // Arrange
    const botName = z.string().describe('Name of the bot')

    // Act
    const botNameWithExample = schema(botName, { example: 'Maple' })

    // Assert
    expect(generateSchemaFromZod(botNameWithExample)).toStrictEqual({
      type: 'string',
      description: 'Name of the bot',
      example: 'Maple',
    })
  })
})
