import { pascal, title } from 'radash'
import { Block } from './section-types-generator.types'
import { SchemaObject } from 'openapi3-ts'

export const pascalize = (str: string) => pascal(title(str))

export function getBlankBlock(): Block {
  return { dependencies: [], content: '', title: '' }
}

/**
 * adds a property to a block's content
 */
export function addPropertyToBlock(targetBlock: Block, content: string): Block {
  return { ...targetBlock, content: targetBlock.content.replace('}', `${content}\n}`) }
}

/**
 * @example will remove `foo` from the following `{ properties: { foo: { $ref: '#/components/schemas/Foo', bar: {...} } } }`
 */
export function remove$RefPropertiesFromSchema(schema: SchemaObject): {
  /**
   * the schema without the properties that have a $ref property
   */
  schema: SchemaObject
  /**
   * names of properties that were removed from the schema
   */
  propertyNamesWith$Ref: string[]
} {
  const processedProperties: string[] = []
  const parsedSchema = Object.entries(schema.properties || {}).reduce(
    (withPropertiesWithoutRef, [propertyKey, propertyValue]) => {
      if (propertyValue.$ref) {
        processedProperties.push(propertyKey)
      } else {
        ;(withPropertiesWithoutRef as any).properties[propertyKey] = propertyValue
      }
      return withPropertiesWithoutRef
    },
    { ...schema, properties: {} } as SchemaObject,
  )
  return { schema: parsedSchema, propertyNamesWith$Ref: processedProperties }
}
