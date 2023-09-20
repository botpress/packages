import { Operation, State } from 'src/state'
export type BlockComposer = (blocks: Block[], targetDirectory: string) => void
export type DefaultState = State<string, string, string>

export type ValueOf<T> = T[keyof T]

/**
 * Operates on a section, returns a block
 */
export type SectionParser = (
  section: ValueOf<DefaultState['schemas']>,
  /**
   * schema that has been dereferenced by the `OpenAPIParser`
   */
  dereferencedSection: ValueOf<DefaultState['schemas']>,
) => Promise<Block>

export type OperationParser = (payload: {
  section: DefaultState['sections'][number]
  operation: Operation<string, string, string, 'json-schema'>
  /**
   * schema that has been dereferenced by the `OpenAPIParser`
   */
  dereferencedOperation: Operation<string, string, string, 'json-schema'>
}) => Promise<Block>

/**
 * A block is a valid typescript block
 * It can be a function, interface, class, type, etc
 */
export type Block = {
  /**
   * name of dependencies of the block
   */
  dependencies: string[]
  /**
   * title of the entity
   * @example - 'Bar' if the function or interface is called Bar
   */
  title: string
  content: string
}
