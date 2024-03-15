import fs from 'fs'
import * as utils from './utils'
import { Operation } from '../opapi'

const CONTENT = (treeStr: string) => `import * as types from './typings'
import { zod as requestSchemas } from './requests'
import { z } from 'zod'

export const createRouteTree = <T extends object>(
  operations: types.Operations<T>,
  validate: <Z extends z.ZodTypeAny>(schema: Z, value: unknown) => z.infer<Z>
): types.RouteTree<T> => (${treeStr})
`

export const exportRouteTree = (operations: Record<string, Operation<string, string>>) => async (path: string) => {
  const opList = utils.values(operations)
  const byPath = utils.groupBy(opList, (op) => op.path)
  const byMethod = utils.mapValues(byPath, (ops) => utils.groupBy(ops, (op) => op.method))

  let tree = '{\n'
  for (const [path, methods] of Object.entries(byMethod)) {
    tree += `  '${path}': {\n`
    for (const [method, ops] of Object.entries(methods)) {
      const [op] = ops
      if (!op) {
        throw new Error('Unexpected empty array')
      }
      if (ops.length > 1) {
        throw new Error(`Multiple operations for ${op.method} ${op.path}`)
      }
      tree += `    ${method}: (props, req) => operations.${op.name}(props, validate(requestSchemas.${op.name}, req)),\n`
    }
    tree += '  },\n'
  }
  tree += '}'

  const content = CONTENT(tree)
  await fs.promises.writeFile(path, content)
}
