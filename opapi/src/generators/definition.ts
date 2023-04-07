type generateDefinitionProps = {
  schemaTypes: string[]
}

export const generateDefinition = ({ schemaTypes }: generateDefinitionProps) => `
import type { GetOperations, GetOperationsInputs, GetOperationsOutputs, GetHandlers } from './type'
import type { components, operations, paths } from './schema'

export type PathNames = keyof paths
export type Handlers = GetHandlers<PathNames, paths>

export type OperationNames = keyof operations

export type Operations = GetOperations<OperationNames, operations>
export type OperationInputs = GetOperationsInputs<OperationNames, operations>
export type OperationOutputs = GetOperationsOutputs<OperationNames, operations>

${schemaTypes.map((type) => `export type ${type} = components['schemas']['${type}']`).join('\n')}
`
