import { initDirectory, saveFile } from 'src/file'
import {
  generateFunctionDefinition,
  generateParameterTypes,
  generateRequestParameterTypes,
  generateSectionTypes
} from './section-types-generator.parsers'
import { DefaultState, OperationParser, SectionExtension } from './section-types-generator.types'

const operationExtensions: OperationParser[] = [
  generateFunctionDefinition,
  generateParameterTypes,
  generateRequestParameterTypes
]
const sectionExtensions: SectionExtension[] = [generateSectionTypes]

export async function generateTypesBySection(state: DefaultState, targetDirectory: string) {
  initDirectory(targetDirectory)

  state.sections.forEach((section) => {
    const schema = state.schemas[section.title]
    executeSectionExtensions(sectionExtensions, section, state).then((sectionContent) => {
      if (schema) {
        executeOperationExtensions(operationExtensions, section, state).then((operationContent) => {
          saveFile(
            targetDirectory,
            `${section.title}.ts`,
            `${sectionContent}\n${operationContent.map((item) => item.join('')).join('')}`
          )
        })
      }
    })
  })
}

function executeSectionExtensions(
  sectionExtensions: SectionExtension[],
  section: DefaultState['sections'][number],
  state: DefaultState
) {
  const schema = state.schemas[section.title]
  if (schema) {
    const extensions = sectionExtensions.map((extension) => extension(schema))
    return Promise.all(extensions)
  } else {
    return new Promise<string[]>((resolve) => resolve(['']))
  }
}

function executeOperationExtensions(
  operationExtensions: OperationParser[],
  section: DefaultState['sections'][number],
  state: DefaultState
): Promise<string[][]> {
  return Promise.all(
    section.operations.map((operationName) => {
      const operation = state.operations[operationName]
      if (operation) {
        const extensions = operationExtensions.map((extension) => extension({ operationName, operation, section }))
        return Promise.all(extensions)
      } else {
        return new Promise<string[]>((resolve) => resolve(['']))
      }
    })
  )
}
