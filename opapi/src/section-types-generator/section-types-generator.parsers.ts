import { compile as compileSchemaToTypes } from 'json-schema-to-typescript'
import { Operation, isOperationWithBodyProps } from 'src/state'
import { pascalize } from './section-types-generator.helpers'
import { Block, OperationParser, SectionParser } from './section-types-generator.types'

export function getBlankBlock(): Block {
  return { dependencies: [], content: '' }
}
export const generateSectionTypes: SectionParser = async (section) => {
  if (section.schema === undefined) return getBlankBlock()
  const content = await compileSchemaToTypes(section.schema, section.section)
  return {
    dependencies: [],
    content: content
  }
}

export const generateFunctionDefinition: OperationParser = async ({ operationName, operation }) => {
  if (!operation) {
    return getBlankBlock()
  }
  const requestBodyName = getFunctionRequestBodyName(operationName)
  const paramsName = getFunctionParamName(operationName)
  return {
    dependencies: [requestBodyName, paramsName],
    content: `export type ${operationName} = (${getFunctionParams(operationName, operation)}) => void\n\n`
  }
}

export const generateRequestParameterTypes: OperationParser = async ({ operationName, operation }) => {
  if (operation && isOperationWithBodyProps(operation)) {
    const content = await compileSchemaToTypes(
      operation.requestBody.schema,
      getFunctionRequestBodyName(operationName),
      {
        bannerComment: ''
      }
    )
    return { content, dependencies: [] }
  }
  return getBlankBlock()
}

export const generateParameterTypes: OperationParser = async ({ operationName, operation }) => {
  const parameters = Object.entries(operation.parameters || {})
  if (operation && parameters.length > 0) {
    const content = parameters.reduce((stringifiedTypeDefinition, [name, parameter], index) => {
      if (parameter.description) {
        stringifiedTypeDefinition += `\n /**\n  * ${parameter.description}\n  */`
      }
      stringifiedTypeDefinition += `\n ${name}: ${parameter.type};`
      if (index === parameters.length - 1) {
        stringifiedTypeDefinition += '\n}\n\n'
      }
      return stringifiedTypeDefinition
    }, `export type ${getFunctionParamName(operationName)} = {`)
    return { content, dependencies: [] }
  }
  return getBlankBlock()
}

function getFunctionParams(
  operationName: string,
  operation: Operation<string, string, string, 'json-schema'> | undefined
) {
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

function getFunctionRequestBodyName(operationName: string): string {
  return `${pascalize(operationName)}Body`
}

function getFunctionParamName(operationName: string): string {
  return `${pascalize(operationName)}BaseParams`
}
