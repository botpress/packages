const typesCode = `

type JsonRequestBody = { requestBody?: { content: { 'application/json': {} } } }
type BinaryRequestBody = { requestBody?: { content: { '*/*': {} } } }

type Responses = { responses: { default: { content: { 'application/json': {} } } } }

type HandleNever<T, Fallback = {}> = [Exclude<T, undefined>] extends [never] ? Fallback : NonNullable<T>

type GetPathParameters<T> = T extends { path?: infer P } ? HandleNever<P> : {}
type GetHeaderParameters<T> = T extends { header?: infer H } ? HandleNever<H> : {}
type GetCookieParameters<T> = T extends { cookie?: infer C } ? HandleNever<C> : {}
type GetQueryParameters<T> = T extends { query?: infer Q } ? HandleNever<Q> : {}

type GetRequestBody<T> = T extends { requestBody?: infer Body }
  ? HandleNever<Body> extends infer SafeBody
    ? SafeBody extends { content: { 'application/json': infer JsonBody } }
      ? JsonBody
      : SafeBody extends { content: { '*/*': infer BinaryBody } }
        ? BinaryBody
        : {}
    : {}
  : {}
type GetParameters<T> = T extends { parameters?: infer Params }
  ? GetPathParameters<HandleNever<Params>> &
      GetHeaderParameters<HandleNever<Params>> &
      GetCookieParameters<HandleNever<Params>> &
      GetQueryParameters<HandleNever<Params>>
  : {}

type HandleEmptyObject<T> = T extends Record<string, never> ? {} : T
type GetOperationInput<T> = GetParameters<T> & HandleEmptyObject<GetRequestBody<T>>
type GetOperationOutput<T extends Responses> = T['responses']['default']['content']['application/json']

export type GetOperations<K extends string, O extends Record<K, Responses>> = {
  [key in K]: (props: GetOperationInput<O[key]>, req: Request) => Promise<GetOperationOutput<O[key]>>
}

export type GetOperationsInputs<K extends string, O extends Record<K, Responses>> = {
  [key in keyof O]: GetOperationInput<O[key]>
}

export type GetOperationsOutputs<K extends string, O extends Record<K, Responses>> = {
  [key in keyof O]: GetOperationOutput<O[key]>
}

type Paths<P extends string> = { [path in P]: { [key: string]: any } }

type HandlerMethodKeys<T> = {
  [K in keyof T]: K extends 'parameters' ? never : [Exclude<T[K], undefined>] extends [never] ? never : K
}[keyof T]

export type GetHandlers<PathKeys extends string, P extends Paths<PathKeys>> = {
  [path in PathKeys]: {
    [method in HandlerMethodKeys<P[path]>]: Handler
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
