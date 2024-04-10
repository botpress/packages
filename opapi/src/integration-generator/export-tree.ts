import fs from 'fs'
import _ from 'lodash'
import { Operation } from '../state'

const IMPORTS = `import * as types from './typings'
import { zod as requestSchemas } from './requests'

`

const PARSE_OPERATION_REQUEST = `type OperationName = keyof types.RequestSchemas
const parseOperationRequest =
  <Op extends OperationName, Tools extends object>(
    op: types.Operations<Tools>[Op],
    requestSchema: types.RequestSchemas[Op]
  ) =>
  async (props: types.OperationProps<Tools>, req: unknown): Promise<types.Response> => {
    const parseResult = requestSchema.safeParse(req)
    if (!parseResult.success) {
      return {
        status: 400,
        body: {
          message: parseResult.error.message,
        },
      }
    }

    const validReq = parseResult.data as types.Requests[Op]
    const response: types.Responses[Op] = await op(props, validReq)
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
