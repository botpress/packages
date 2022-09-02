import _ from 'lodash'
import { AnyEndpoint } from './typings'

const SLASH = '/'
const mkpth = (baseUrl: string, path: string) => {
  const sep = path.startsWith(SLASH) ? '' : SLASH
  return `${baseUrl}${sep}${path}`
}

export const generateCliDocumentation = (endpoints: AnyEndpoint[], baseUrl: string = '<*>'): string => {
  if (!endpoints) {
    return ''
  }

  const lines: string[] = []
  const longuestMethod = _(endpoints)
    .map((e) => e.method)
    .maxBy((m) => m.length)!

  for (const e of endpoints) {
    const spacing = _.repeat(' ', longuestMethod.length - e.method.length)
    const formattedMethod = e.method.toUpperCase() + spacing
    lines.push(`${formattedMethod} ${mkpth(baseUrl, e.path)} (${e.operationId})`)
  }

  const longuestLine = _.maxBy(lines, (l) => l.length)!
  const sep = _.repeat('=', longuestLine?.length)
  lines.push(sep)
  lines.unshift(sep)
  return lines.join('\n')
}
