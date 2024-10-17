import util from 'util'

export type FormatOptions = {
  depth: number
  colors: boolean
  singleLine: boolean
}

const DEFAULT_FORMAT_OPTS: FormatOptions = {
  depth: 10,
  colors: true,
  singleLine: true
}

export const formatObject = (data: any, opts: Partial<FormatOptions> = {}) => {
  const options: FormatOptions = { ...DEFAULT_FORMAT_OPTS, ...opts }

  const inspectOpts: util.InspectOptions = {
    depth: options.depth,
    colors: options.colors
  }

  const formatted = util.inspect(data, inspectOpts)

  if (!options.singleLine) {
    return formatted
  }

  return formatted.replace(/\n/g, ' ').replace(/\s+/g, ' ')
}
