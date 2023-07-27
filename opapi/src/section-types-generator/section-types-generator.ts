import { initDirectory, saveFile } from 'src/file'
import {
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes,
  parseSectionTypes,
  getBlankBlock
} from './section-types-generator.parsers'
import { Block, DefaultState, OperationParser, SectionParser, BlockComposer } from './section-types-generator.types'
import { camel } from 'radash'

const operationGenerators: OperationParser[] = [
  parseFunctionDefinition,
  parseParameterTypes,
  parseRequestParameterTypes
]
const sectionGenerators: SectionParser[] = [parseSectionTypes]

export async function generateTypesBySection(state: DefaultState, targetDirectory: string) {
  initDirectory(targetDirectory)
  state.sections.forEach(async (section) => {
    const [sectionBlocks, operationBlocks] = await Promise.all([
      executeSectionParsers(sectionGenerators, section, state),
      executeOperationParsers(operationGenerators, section, state)
    ])
    composeFilesFromBlocks([...sectionBlocks, ...operationBlocks], targetDirectory)
  })
}

const composeFilesFromBlocks: BlockComposer = (blocks: Block[], targetDirectory: string) => {
  blocks.forEach((block) => {
    let content = ''
    content = getImportsForDependencies(block, blocks, content)
    content += block.content
    if (Boolean(content) && Boolean(block.title)) {
      saveFile(targetDirectory, `${camel(block.title)}.ts`, content)
    }
  })
}

function getImportsForDependencies(block: Block, blocks: Block[], content: string) {
  if (Boolean(block.dependencies.length)) {
    const dependencies = blocks.filter((_block) => block.dependencies.includes(_block.title))
    dependencies.forEach((dependency) => {
      content += `import { ${dependency.title} } from './${camel(dependency.title)}'\n`
    })
  }
  return content
}

function executeSectionParsers(
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

async function executeOperationParsers(
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
