import OpenAPIParser from '@readme/openapi-parser'
import type { SchemaObject } from 'openapi3-ts'
import { pascal, title } from 'radash'
import { createOpenapi } from 'src/openapi'
import { Block, DefaultState } from './types'

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
  dereferencedSchema: SchemaObject,
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
  const processed: ReturnType<typeof remove$RefPropertiesFromSchema> = Object.entries(
    dereferencedSchema.properties ?? {},
  ).reduce(
    (_processed, [dereferencedPropertyKey, dereferencedPropertyValue]) => {
      const propertyValue = schema.properties?.[dereferencedPropertyKey]
      if (propertyValue && '$ref' in propertyValue && propertyValue?.$ref) {
        _processed.propertyNamesWith$Ref.push(dereferencedPropertyKey)
      } else {
        _processed.schema.properties[dereferencedPropertyKey] = dereferencedPropertyValue as SchemaObject
      }
      return _processed
    },
    { schema: { ...schema, properties: {} as Record<string, SchemaObject> }, propertyNamesWith$Ref: [] as string[] },
  )
  return processed
}

/**
 * Returns a deep clone of the state with the schemas dereferenced
 */
export async function getDereferencedSchema(state: DefaultState) {
  // this doesn't do a deep clone, which helps us in the dereference step
  // in other words, openapi still has references to the original objects in state
  const clonedState = JSON.parse(JSON.stringify(state))
  const openapi = createOpenapi(clonedState).getSpec()
  // this dereferences those objects in place
  await OpenAPIParser.dereference(openapi as any)

  return clonedState
}
