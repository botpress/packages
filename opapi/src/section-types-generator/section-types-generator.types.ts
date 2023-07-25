import { Operation, State } from 'src/state'

export type DefaultState = State<string, string, string>

export type ValueOf<T> = T[keyof T]

export type SectionExtension = (section: ValueOf<DefaultState['schemas']>) => Promise<string>

export type OperationParser = (payload: {
  section: DefaultState['sections'][number]
  operationName: string
  operation: Operation<string, string, string, 'json-schema'>
}) => Promise<string>
