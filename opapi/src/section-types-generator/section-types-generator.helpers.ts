import { pascal, title } from 'radash'
import { Operation, isOperationWithBodyProps } from 'src/state'

export const pascalize = (str: string) => pascal(title(str))

export function getFunctionParams(
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
    paramsString += `${pascalize(operationName)}BaseParams`
  }
  if (parameters.length && operationHasBodyProps) {
    paramsString += ' & '
  }
  if (operationHasBodyProps) {
    paramsString += `${pascalize(operationName)}Body`
  }
  return paramsString
}
