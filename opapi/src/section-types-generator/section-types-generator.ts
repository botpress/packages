import { camel } from 'radash'
import { saveFile } from 'src/file'
import { getBlankBlock } from './section-types-generator.helpers'
import { Block, BlockComposer, DefaultState, OperationParser, SectionParser } from './section-types-generator.types'

export const composeFilesFromBlocks: BlockComposer = (blocks: Block[], targetDirectory: string) => {
  blocks.forEach((block) => {
    let content = getImportsForDependencies(block, blocks)
    content += block.content
    if (Boolean(content) && Boolean(block.title)) {
      saveFile(targetDirectory, `${camel(block.title)}.ts`, content)
    }
  })
}

export const getImportsForDependencies = (block: Block, blocks: Block[]) => {
  let content = ''
  if (Boolean(block.dependencies.length)) {
    const dependencies = blocks.filter((_block) => block.dependencies.includes(_block.title))
    dependencies.forEach((dependency) => {
      content += `import { ${dependency.title} } from './${camel(dependency.title)}'\n`
    })
  }
  return content
}

export const executeSectionParsers = (
  sectionExtensions: SectionParser[],
  section: DefaultState['sections'][number],
  state: DefaultState,
): Promise<Block[]> => {
  const schema = state.schemas[section.title]
  if (schema) {
    const extensions = sectionExtensions.map((extension) => extension(schema))
    return Promise.all(extensions)
  } else {
    return new Promise<Block[]>((resolve) => resolve([getBlankBlock()]))
  }
}

export const executeOperationParsers = async (
  operationExtensions: OperationParser[],
  section: DefaultState['sections'][number],
  state: DefaultState,
): Promise<Block[]> => {
  const blocks = await Promise.all(
    section.operations.map((operationName) => {
      const operation = state.operations[operationName]
      if (operation) {
        const extensions = operationExtensions.map((extension) => extension({ operationName, operation, section }))
        return Promise.all(extensions)
      } else {
        return new Promise<Block[]>((resolve) => resolve([getBlankBlock()]))
      }
    }),
  )
  return blocks.flat()
}
