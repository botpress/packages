import fs from 'fs'
import _ from 'lodash'
import { Operation } from '../state'

const IMPORTS = `import * as types from './typings'
import { json as requestSchemas } from './requests'
import { JSONSchema7 } from 'json-schema'
import Ajv from 'ajv'

const ajv = new Ajv()

`

const PARSE_OPERATION_REQUEST = `type OperationName = keyof types.Requests
const parseOperationRequest =
  <Op extends OperationName, OperationProps extends object>(
    op: types.Operations<OperationProps>[Op],
    requestSchema: JSONSchema7
  ) =>
  async (props: OperationProps, req: unknown): Promise<types.Response> => {

    const validate = ajv.compile<unknown>(requestSchema)
    const isValid = validate(req)
    if (!isValid) {
      const message = validate.errors?.[0]?.message ?? 'Invalid request'
      return {
        status: 400,
        body: {
          message,
        },
      }
    }
    
    const response: types.Responses[Op] = await op(props, req as types.Requests[Op])
    return response
  }

`

const PARSE_OPERATIONS_REQUEST_HEAD = `const parseOperationsRequest = <Tools extends object>(operations: types.Operations<Tools>) =>
({
`

const PARSE_OPERATIONS_REQUEST_FOOT = `} satisfies types.Routes<Tools>)

`

const CREATE_ROUTE_TREE_HEAD = `export const createRouteTree = <T extends object>(
  operations: types.Operations<T>
): types.RouteTree<T> => {
  const parsedOperations = parseOperationsRequest(operations)
  return {
`

const CREATE_ROUTE_TREE_FOOT = `  }
}
`

export const exportRouteTree =
  (operations: Record<string, Operation<string, string, string, 'json-schema'>>) => async (path: string) => {
    let content = ''
    content += IMPORTS
    content += PARSE_OPERATION_REQUEST

    content += PARSE_OPERATIONS_REQUEST_HEAD
    for (const [_, { name }] of Object.entries(operations)) {
      content += `  ${name}: parseOperationRequest(operations.${name}, requestSchemas.${name}),\n`
    }
    content += PARSE_OPERATIONS_REQUEST_FOOT

    const opList = _.values(operations)
    const byPath = _.groupBy(opList, (op) => op.path)
    const byMethod = _.mapValues(byPath, (ops) => _.groupBy(ops, (op) => op.method))

    content += CREATE_ROUTE_TREE_HEAD
    for (const [path, methods] of Object.entries(byMethod)) {
      content += `    '${path}': {\n`
      for (const [method, ops] of Object.entries(methods)) {
        const [op] = ops
        if (!op) {
          throw new Error('Unexpected empty array')
        }
        if (ops.length > 1) {
          throw new Error(`Multiple operations for ${op.method} ${op.path}`)
        }
        content += `      ${method}: (props, req) => parsedOperations.${op.name}(props, req),\n`
      }
      content += '    },\n'
    }
    content += CREATE_ROUTE_TREE_FOOT

    await fs.promises.writeFile(path, content)
  }
