import fs from 'fs/promises'

const CONTENT = `import qs from 'qs'
import { isAxiosError } from 'axios'
import { isApiError } from './errors'
import * as types from './typings'

type RoutePart =
  | {
      type: 'argument'
      name: string
    }
  | {
      type: 'namespace'
      name: string
    }

const tokenize = (path: string) => path.split('/').filter((x) => !!x)

class Route {
  private _parts: RoutePart[]

  public constructor(public readonly path: string) {
    this._parts = this._parse(path)
  }

  public match(path: string): Record<string, string> | null {
    const tokens = tokenize(path)

    if (tokens.length !== this._parts.length) {
      return null
    }

    const args: Record<string, string> = {}
    const zipped = tokens.map((token: string, index: number) => [token, this._parts[index]!] as const)
    for (const [token, part] of zipped) {
      if (part.type === 'argument') {
        args[part.name] = token
        continue
      }

      if (part.name !== token) {
        return null
      }
    }

    return args
  }

  private _parse(path: string): RoutePart[] {
    const tokens = tokenize(path)
    const parts: RoutePart[] = []

    for (const token of tokens) {
      const match = /{(.+?)}/.exec(token)
      if (match) {
        parts.push({
          type: 'argument',
          name: match[1]!,
        })
        continue
      }

      parts.push({
        type: 'namespace',
        name: token,
      })
    }

    return parts
  }
}

type RouteMatch = { path: string; params: Record<string, string> }
export class Router {
  private _parsed: Route[] = []

  public constructor(routes: string[]) {
    this._parsed = routes.map((route) => new Route(route))
  }

  public match(path: string): RouteMatch | null {
    const matches: RouteMatch[] = []
    for (const route of this._parsed) {
      const params = route.match(path)
      if (params !== null) {
        matches.push({
          path: route.path,
          params,
        })
      }
    }

    if (matches.length === 0) {
      return null
    }

    // find the match with the least amount of params (i.e. the most specific match)
    matches.sort((a, b) => Object.keys(a.params).length - Object.keys(b.params).length)
    return matches[0]!
  }
}

const getErrorBody = (thrown: unknown) => {
  if (isAxiosError(thrown)) {
    const data = thrown.response?.data
    const statusCode = thrown.response?.status

    if (!data) {
      return \`\${thrown.message} (no response data) (Status Code: \${statusCode})\`
    }

    return \`\${data.message || data.error?.message || data.error || data.body || thrown.message} (Status Code: \${statusCode})\`
  } else if (thrown instanceof Error) {
    return thrown.message
  }
  try {
    return JSON.stringify(thrown)
  } catch {
    return 'Unknown error'
  }
}

type PlainRequest = {
  body?: string;
  path: string;
  query: string;
  method: string;
  headers: {
      [key: string]: string | undefined;
  };
}

type PlainResponse = {
  body?: string
  headers?: {
    [key: string]: string
  }
  status?: number
}

export const handleRequest = async <T extends { req: PlainRequest }>(routes: Record<string, Record<string, types.Route<T>>>, props: T): Promise<PlainResponse> => {
    try {
      const router = new Router(Object.keys(routes))
      const match = router.match(props.req.path)
      if (!match) {
        return {
          status: 404,
          body: JSON.stringify({ message: "Route doesn't exist" }),
        }
      }

      const route = routes[match.path]!
      const method = props.req.method.toLowerCase()
      const leaf = route[method]
      if (!leaf) {
        return {
          status: 404,
          body: JSON.stringify({ message: "Method doesn't exist" }),
        }
      }

      let body: any
      if (props.req.body) {
        try {
          body = JSON.parse(props.req.body)
        } catch {
          return {
            status: 400,
            body: JSON.stringify({ message: 'Invalid JSON body' }),
          }
        }
      }

      const res = await leaf(
        props,
        {
          path: match.path,
          method,
          body,
          params: match.params,
          headers: props.req.headers,
          query: qs.parse(props.req.query) as Record<string, string | undefined>,
        }
      )

      return {
        body: typeof res.body === 'string' ? res.body : JSON.stringify(res.body),
        status: res.status ?? 200,
        headers: res.headers,
      }
    } catch (thrown) {
      if (isApiError(thrown)) {
        return {
          status: thrown.code,
          body: JSON.stringify(thrown.toJSON()),
        }
      }
      return {
        status: 500,
        body: getErrorBody(thrown),
      }
    }
  }

`

export const exportHandler = async (outFile: string) => {
  await fs.writeFile(outFile, CONTENT)
}
