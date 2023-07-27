import { initDirectory, saveFile } from 'src/file'
import {
  generateFunctionDefinition,
  generateParameterTypes,
  generateRequestParameterTypes,
  generateSectionTypes,
  getBlankBlock
} from './section-types-generator.parsers'
import { Block, DefaultState, OperationParser, SectionParser } from './section-types-generator.types'

const operationGenerators: OperationParser[] = [
  generateFunctionDefinition,
  generateParameterTypes,
  generateRequestParameterTypes
]
const sectionGenerators: SectionParser[] = [generateSectionTypes]

export async function generateTypesBySection(state: DefaultState, targetDirectory: string) {
  initDirectory(targetDirectory)
  state.sections.forEach(async (section) => {
    const [sectionBlocks, operationBlocks] = await Promise.all([
      executeSectionGenerators(sectionGenerators, section, state),
      executeOperationGenerators(operationGenerators, section, state)
    ])
    const contentForFiles = composeFilesFromBlocks([...sectionBlocks, ...operationBlocks])
    saveFile(targetDirectory, `${section.title}.ts`, contentForFiles.join('\n'))
  })
}

function composeFilesFromBlocks(blocks: Block[]) {
  return blocks.map((block) => block.content)
}

function executeSectionGenerators(
  sectionExtensions: SectionParser[],
  section: DefaultState['sections'][number],
  state: DefaultState
): Promise<Block[]> {
  const schema = state.schemas[section.title]
  if (schema) {
    const extensions = sectionExtensions.map((extension) => extension(schema))
    return Promise.all(extensions)
  } else {
    return new Promise<Block[]>((resolve) => resolve([getBlankBlock()]))
  }
}

async function executeOperationGenerators(
  operationExtensions: OperationParser[],
  section: DefaultState['sections'][number],
  state: DefaultState
): Promise<Block[]> {
  const blocks = await Promise.all(
    section.operations.map((operationName) => {
      const operation = state.operations[operationName]
      if (operation) {
        const extensions = operationExtensions.map((extension) => extension({ operationName, operation, section }))
        return Promise.all(extensions)
      } else {
        return new Promise<Block[]>((resolve) => resolve([getBlankBlock()]))
      }
    })
  )
  return blocks.flat()
}
