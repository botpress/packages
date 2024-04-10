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
) => `import { IntegrationProps } from '.botpress'
import { z } from 'zod'
import { zod as requests } from '../gen/requests'
import { zod as responses } from '../gen/responses'

type SdkHandler = IntegrationProps['handler']
type HandlerProps = Parameters<SdkHandler>[0]

type ValueOf<T> = T[keyof T]
type Cast<T, U> = T extends U ? T : U

type Routing = ${JSON.stringify(getRouting(operations), null, 2)}

// requests

export type RequestSchemas = typeof requests

export type RequestSchemaTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: RequestSchemas[Cast<Routing[R][M], keyof RequestSchemas>]
  }
}

export type Requests = {
  [K in keyof RequestSchemas]: z.infer<RequestSchemas[K]>
}

export type RequestTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: z.infer<RequestSchemaTree[R][M]>
  }
}

// responses

export type ResponseSchemas = typeof responses

export type ResponseSchemaTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: ResponseSchemas[Cast<Routing[R][M], keyof ResponseSchemas>]
  }
}

export type Responses = {
  [K in keyof ResponseSchemas]: z.infer<ResponseSchemas[K]>
}

export type ResponseTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: Responses[Cast<Routing[R][M], keyof Responses>]
  }
}

// handlers

export type Handlers = {
  [K in keyof RequestSchemas]: (req: Requests[K]) => Promise<Responses[K]>
}

export type HandlerTree = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (req: RequestTree[R][M]) => Promise<ResponseTree[R][M]>
  }
}

// operations

export type OperationProps<Tools extends object> = HandlerProps & Tools

export type Operations<Tools extends object> = {
  [TName in keyof Handlers]: (props: OperationProps<Tools>, req: Requests[TName]) => Promise<Responses[TName]>
}

export type OperationTree<Tools extends object> = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (props: OperationProps<Tools>, req: RequestTree[R][M]) => Promise<ResponseTree[R][M]>
  }
}

export type Operation<Tools extends object> = ValueOf<Operations<Tools>>

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

export type Routes<Tools extends object> = {
  [TName in keyof Handlers]: (props: OperationProps<Tools>, req: Request) => Promise<Response>
}

export type RouteTree<Tools extends object> = {
  [R in keyof Routing]: {
    [M in keyof Routing[R]]: (props: OperationProps<Tools>, req: Request) => Promise<Response>
  }
}

export type Route<Tools extends object> = ValueOf<Routes<Tools>>
`

export const exportTypings =
  (operations: Record<string, Operation<string, string, string, 'json-schema'>>) => async (outFile: string) => {
    await fs.writeFile(outFile, CONTENT(operations))
  }
