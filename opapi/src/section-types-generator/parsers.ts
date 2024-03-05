import { JSONSchema, compile as compileSchemaToTypes } from 'json-schema-to-typescript'
import type { SchemaObject } from 'openapi3-ts'
import { title } from 'radash'
import { Operation, isOperationWithBodyProps } from 'src/state'
import { addPropertyToBlock, getBlankBlock, pascalize, remove$RefPropertiesFromSchema } from './helpers'
import { Block, OperationParser, SectionParser } from './types'

const parseReturnTypes: OperationParser = async ({ operation, dereferencedOperation }) => {
  const response = operation.response
  if (!operation.response) return { ...getBlankBlock(), content: 'void' }
  return getBlockWithDependenciesForSchema(
    getReturnTypeName(operation.name),
    response.schema,
    dereferencedOperation.response.schema,
  )
}

const parseSectionTypes: SectionParser = async (section, dereferencedSection) => {
  if (section.schema === undefined) return getBlankBlock()
  return getBlockWithDependenciesForSchema(pascalize(section.section), section.schema, dereferencedSection.schema)
}

const parseFunctionDefinition: OperationParser = async ({ operation }) => {
  if (!operation) {
    return getBlankBlock()
  }
  const requestBodyName = getFunctionRequestBodyName(operation.name)
  const paramsName = getFunctionParamName(operation.name)
  const functionName = operation.name
  const returnTypeName = getReturnTypeName(operation.name)
  return {
    dependencies: [requestBodyName, paramsName, returnTypeName],
    title: functionName,
    content: `${wrapWithJsDocComment(operation.description)}\n export type ${functionName} = (${getFunctionParams(
      operation.name,
      operation,
    )}) => ${returnTypeName}\n\n`,
  }
}

const parseRequestParameterTypes: OperationParser = async ({ operation, dereferencedOperation }) => {
  if (
    operation &&
    isOperationWithBodyProps(operation) &&
    // repeating but ¯\_(ツ)_/¯
    dereferencedOperation &&
    isOperationWithBodyProps(dereferencedOperation)
  ) {
    const functionRequestBodyName = getFunctionRequestBodyName(operation.name)
    return getBlockWithDependenciesForSchema(
      functionRequestBodyName,
      operation.requestBody.schema,
      dereferencedOperation.requestBody.schema,
    )
  }
  return getBlankBlock()
}

const parseParameterTypes: OperationParser = async ({ operation }) => {
  const parameters = Object.entries(operation.parameters || {})
  if (operation && parameters.length > 0) {
    const functionParamName = getFunctionParamName(operation.name)
    const content = parameters.reduce((stringifiedTypeDefinition, [name, parameter], index) => {
      if (parameter.description) {
        stringifiedTypeDefinition += `\n /**\n  * ${parameter.description}\n  */`
      }
      stringifiedTypeDefinition += `\n ${name}: ${parameter.type};`
      if (index === parameters.length - 1) {
        stringifiedTypeDefinition += '\n}\n\n'
      }
      return stringifiedTypeDefinition
    }, `export type ${functionParamName} = {`)
    return { content, dependencies: [], title: functionParamName }
  }
  return getBlankBlock()
}

function getReturnTypeName(operationName: string): string {
  return `${pascalize(operationName)}Response`
}

function getFunctionParams(
  operationName: string,
  operation: Operation<string, string, string, 'json-schema'> | undefined,
): string {
  if (!operation) {
    return ''
  }
  const parameters = Object.entries(operation.parameters || {})
  const operationHasBodyProps = isOperationWithBodyProps(operation)
  let paramsString = ''
  if (parameters.length || operationHasBodyProps) {
    paramsString += 'params: '
  }
  if (parameters.length) {
    paramsString += `${getFunctionParamName(operationName)}`
  }
  if (parameters.length && operationHasBodyProps) {
    paramsString += ' & '
  }
  if (operationHasBodyProps) {
    paramsString += `${pascalize(operationName)}Body`
  }
  return paramsString
}

function wrapWithJsDocComment(content: string): string {
  return `/**\n * ${content}\n */\n`
}
function getFunctionRequestBodyName(operationName: string): string {
  return `${pascalize(operationName)}Body`
}

function getFunctionParamName(operationName: string): string {
  return `${pascalize(operationName)}BaseParams`
}

const getBlockWithDependenciesForSchema = async (
  blockTitle: string,
  schema: SchemaObject,
  dereferencedSchema: SchemaObject,
): Promise<Block> => {
  // since the schema is dereferenced, i.e., ref properties replaced, we need to process the $ref properties differently
  const { schema: processedSchema, propertyNamesWith$Ref } = remove$RefPropertiesFromSchema(schema, dereferencedSchema)
  const content = await compileSchemaToTypes(processedSchema as JSONSchema, blockTitle, { bannerComment: '' })
  const block = {
    dependencies: propertyNamesWith$Ref.map((name) => title(name)) as string[],
    content: content,
    title: blockTitle,
  }

  return addPropertyToBlock(
    block,
    propertyNamesWith$Ref.map((property) => `\n  ${property}: ${title(property)};`).join(''),
  )
}

export const operationParsers: OperationParser[] = [
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseReturnTypes,
]
export const sectionParsers: SectionParser[] = [parseSectionTypes]
