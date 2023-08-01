import { last, pascal, title } from 'radash'
import { Block } from './types'
import { SchemaObject } from 'openapi3-ts'

export const pascalize = (str: string) => pascal(title(str))

export function getBlankBlock(): Block {
  return { dependencies: [], content: '', title: '' }
}

/**
 * adds a property to a block's content
 */
export function addPropertyToBlock(targetBlock: Block, content: string): Block {
  const lastCurlyBraceIndex = targetBlock.content.lastIndexOf('}')
  if (lastCurlyBraceIndex > -1) {
    const newContent = insertValueAtIndex(targetBlock.content, lastCurlyBraceIndex, `${content}\n`)
    return { ...targetBlock, content: newContent }
  }
  return targetBlock
}

function insertValueAtIndex(originalString: string, index: number, valueToInsert: string) {
  if (index < 0 || index > originalString.length) {
    throw new Error('Invalid index')
  }

  const partBeforeIndex = originalString.slice(0, index)
  const partAfterIndex = originalString.slice(index)

  return partBeforeIndex + valueToInsert + partAfterIndex
}

/**
 * @example will remove `foo` from the following `{ properties: { foo: { $ref: '#/components/schemas/Foo', bar: {...} } } }`
 */
export function remove$RefPropertiesFromSchema(
  schema: SchemaObject,
  schemaRefs: Record<string, boolean>,
): {
  /**
   * the schema without the properties that have a $ref property
   */
  schema: SchemaObject
  /**
   * names of properties that were removed from the schema
   */
  propertyNamesWith$Ref: string[]
} {
  const schemaRefNames = Object.keys(schemaRefs).map((refName) => refName.toLowerCase())
  const processed: ReturnType<typeof remove$RefPropertiesFromSchema> = Object.entries(schema.properties ?? {}).reduce(
    (_processed, [propertyKey, propertyValue]) => {
      if (schemaRefNames.includes(propertyKey.toLowerCase())) {
        _processed.propertyNamesWith$Ref.push(propertyKey)
      } else {
        _processed.schema.properties[propertyKey] = propertyValue
      }
      return _processed
    },
    { schema: { ...schema, properties: {} as Record<string, SchemaObject> }, propertyNamesWith$Ref: [] as string[] },
  )
  return processed
}
