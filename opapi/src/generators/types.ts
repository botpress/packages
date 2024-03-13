const typesCode = `

type JsonRequestBody = { requestBody?: { content: { 'application/json': {} } } }
type BinaryRequestBody = { requestBody?: { content: { '*/*': {} } } }

type RequestBody = JsonRequestBody | BinaryRequestBody
type Responses = { responses: { default: { content: { 'application/json': {} } } } }
type Parameters = { parameters?: {} }

type GetPathParameters<T> = T extends { path?: any } ? NonNullable<T['path']> : {}
type GetHeaderParameters<T> = T extends { header?: any } ? NonNullable<T['header']> : {}
type GetCookieParameters<T> = T extends { cookie?: any } ? NonNullable<T['cookie']> : {}
type GetQueryParameters<T> = T extends { query?: any } ? NonNullable<T['query']> : {}

type GetRequestBody<T> = T extends JsonRequestBody ? NonNullable<T['requestBody']>['content']['application/json'] : T extends BinaryRequestBody ? NonNullable<T['requestBody']>['content']['*/*'] : {}
type GetParameters<T> = T extends Parameters
  ? GetPathParameters<NonNullable<T['parameters']>> &
      GetHeaderParameters<NonNullable<T['parameters']>> &
      GetCookieParameters<NonNullable<T['parameters']>> &
      GetQueryParameters<NonNullable<T['parameters']>>
  : {}

type GetOperationInput<T> = GetParameters<T> & GetRequestBody<T>
type GetOperationOutput<T extends Responses> = T['responses']['default']['content']['application/json']

type Operation<K extends string> = {
  [key in K]: RequestBody & Responses & Parameters
}

export type GetOperations<K extends string, O extends Operation<K>> = {
  [key in K]: (props: GetOperationInput<O[key]>, req: Request) => Promise<GetOperationOutput<O[key]>>
}

export type GetOperationsInputs<K extends string, O extends Operation<K>> = {
  [key in keyof O]: GetOperationInput<O[key]>
}

export type GetOperationsOutputs<K extends string, O extends Operation<K>> = {
  [key in keyof O]: GetOperationOutput<O[key]>
}

type Paths<P extends string> = { [path in P]: { [key: string]: any } }

export type GetHandlers<PathKeys extends string, P extends Paths<PathKeys>> = {
  [path in PathKeys]: {
    [method in keyof P[path]]: Handler
  }
}
`

const genericRequestResponseTypesCode = `
export type Request = {
  path: string;
  method: string;
  body: any;
  headers: Record<string, string | undefined>;
  params: Record<string, string | undefined>;
  query: Record<string, string | undefined>;
};

export type Response = {
  status: (code: number) => Response;
  json: (body: any) => void;
  setHeader: (name: string, value: string) => void;
  send(data: string | Buffer): void;
};

export type Handler = (req: Request, res: Response) => Promise<void> | void;
`

export function generateTypes(useExpressTypes: boolean) {
  let code = ''

  if (useExpressTypes) {
    code += "import type { Handler, Request, Response } from 'express'"
  } else {
    code += genericRequestResponseTypesCode
  }

  code += typesCode

  return code
}
