import { camel } from 'radash'
import { saveFile } from 'src/file'
import log from 'src/log'
import * as helpers from './helpers'
import { Block, BlockComposer, DefaultState, OperationParser, SectionParser } from './types'

/**
 * @param blocks all the blocks generated until now
 * @param targetDirectory
 */
export const composeFilesFromBlocks: BlockComposer = (blocks: Block[], targetDirectory: string) => {
  log.info('Composing files from blocks')
  blocks.forEach((block) => {
    let content = getImportsForDependencies(block, blocks)
    content += block.content
    if (Boolean(content) && Boolean(block.title)) {
      saveFile(targetDirectory, `${camel(block.title)}.ts`, content)
    }
  })
}

export const generateSectionsFile = (state: DefaultState, targetDirectory: string) => {
  log.info('Generating sections file')
  const sections = state.sections.map((section) => section.name)
  saveFile(
    targetDirectory,
    'sections.ts',
    `export const sections = ${JSON.stringify(sections)} as const;\n export type Sections = typeof sections[number];`,
  )
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

export const executeSectionParsers = async (
  sectionParsers: SectionParser[],
  section: DefaultState['sections'][number],
  state: DefaultState,
): Promise<Block[]> => {
  log.info('Executing section parsers')
  const dereferencedState = await helpers.getDereferencedSchema(state)
  const schema = state.schemas[section.title]
  const dereferencedSchema = dereferencedState.schemas[section.title]
  if (schema) {
    const extensions = sectionParsers.map((parser) => parser(schema, dereferencedSchema))
    return Promise.all(extensions)
  } else {
    return new Promise<Block[]>((resolve) => resolve([helpers.getBlankBlock()]))
  }
}

export const executeOperationParsers = async (
  operationParsers: OperationParser[],
  section: DefaultState['sections'][number],
  state: DefaultState,
): Promise<Block[]> => {
  log.info('Executing section parsers')
  const dereferencedState = await helpers.getDereferencedSchema(state)

  const blocks = await Promise.all(
    section.operations.map((operationName) => {
      const operation = state.operations[operationName]
      const dereferencedOperation = dereferencedState.operations[operationName]
      if (operation) {
        const extensions = operationParsers.map((parser) => parser({ operation, section, dereferencedOperation }))
        return Promise.all(extensions)
      } else {
        return new Promise<Block[]>((resolve) => resolve([helpers.getBlankBlock()]))
      }
    }),
  )
  return blocks.flat()
}
