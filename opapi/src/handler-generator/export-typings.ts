import { Operation } from '../state'
import fs from 'fs/promises'
import _ from 'lodash'

const getRouting = (
  operations: Record<string, Operation<string, string, string, 'json-schema'>>,
): Record<string, Record<string, string>> => {
  const opList = _.values(operations)
  const byPath = _.groupBy(opList, (op) => op.path)
  const byMethod = _.mapValues(byPath, (ops) => _.groupBy(ops, (op) => op.method))
  const names = _.mapValues(byMethod, (byMethod) =>
    _.mapValues(byMethod, (ops) => {
      const [op] = ops
      if (!op) {
        throw new Error('Unexpected empty array')
      }
      if (ops.length > 1) {
        throw new Error(`Multiple operations for ${op.method} ${op.path}`)
      }
      return op.name
    }),
  )
  return names
}

const CONTENT = (
  operations: Record<string, Operation<string, string, string, 'json-schema'>>,
) => `import { Types as _Requests } from '../gen/requests'
import { Types as _Responses } from '../gen/responses'

type ValueOf<T> = T[keyof T]
type Cast<T, U> = T extends U ? T : U

type Routing = ${JSON.stringify(getRouting(operations), null, 2)}

// requests

export type Requests = _Requests

export type RequestTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: Requests[Cast<Routing[R][M], keyof Requests>]
  }
}

// responses

export type Responses = _Responses

export type ResponseTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: Responses[Cast<Routing[R][M], keyof Responses>]
  }
}

// handlers

export type Handlers = {
  [K in keyof Requests]: (req: Requests[K]) => Promise<Responses[K]>
}

export type HandlerTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (req: RequestTree[R][M]) => Promise<ResponseTree[R][M]>
  }
}

// operations

export type Operations<OperationProps extends object> = {
  [TName in keyof Handlers]: (props: OperationProps, req: Requests[TName]) => Promise<Responses[TName]>
}

export type OperationTree<OperationProps extends object> = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (props: OperationProps, req: RequestTree[R][M]) => Promise<ResponseTree[R][M]>
  }
}

export type Operation<OperationProps extends object> = ValueOf<Operations<OperationProps>>

// routes

export type Request = {
  path: string
  method: string
  body: any
  headers: Record<string, string | undefined>
  params: Record<string, string | undefined>
  query: Record<string, string | undefined>
}

export type Response = {
  body?: string | object
  headers?: {
    [key: string]: string
  }
  status?: number
}

export type Routes<OperationProps extends object> = {
  [TName in keyof Handlers]: (props: OperationProps, req: Request) => Promise<Response>
}

export type RouteTree<OperationProps extends object> = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (props: OperationProps, req: Request) => Promise<Response>
  }
}

export type Route<OperationProps extends object> = ValueOf<Routes<OperationProps>>
`

export const exportTypings =
  (operations: Record<string, Operation<string, string, string, 'json-schema'>>) => async (outFile: string) => {
    await fs.writeFile(outFile, CONTENT(operations))
  }
