import { compile as compileSchemaToTypes } from 'json-schema-to-typescript'
import { isOperationWithBodyProps } from 'src/state'
import { getFunctionParams, pascalize } from './section-types-generator.helpers'
import { OperationParser, SectionExtension } from './section-types-generator.types'

export const generateSectionTypes: SectionExtension = async (section) => {
  if (section.schema === undefined) return ''
  return compileSchemaToTypes(section.schema, section.section)
}

export const generateFunctionDefinition: OperationParser = async ({ operationName, operation }) => {
  return `export type ${operationName} = (${getFunctionParams(operationName, operation)}) => void\n\n`
}

export const generateRequestParameterTypes: OperationParser = async ({ operationName, operation }) => {
  if (!operation) {
    return ''
  }
  if (isOperationWithBodyProps(operation)) {
    const content = await compileSchemaToTypes(operation.requestBody.schema, `${operationName}Body`, {
      bannerComment: ''
    })
    return content
  }
  return ``
}

export const generateParameterTypes: OperationParser = async ({ operationName, operation }) => {
  if (!operation) {
    return ''
  }
  const parameters = Object.entries(operation.parameters || {})
  if (parameters.length === 0) return ''
  return parameters.reduce((stringifiedTypeDefinition, [name, parameter], index) => {
    if (parameter.description) {
      stringifiedTypeDefinition += `\n /**\n  * ${parameter.description}\n  */`
    }
    stringifiedTypeDefinition += `\n ${name}: ${parameter.type};`
    if (index === parameters.length - 1) {
      stringifiedTypeDefinition += '\n}\n\n'
    }
    return stringifiedTypeDefinition
  }, `export type ${pascalize(operationName)}BaseParams = {`)
}
