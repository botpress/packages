const URL_REGEX = /^\/([\w|-]+)$/ // /:tunnelId

export const formatUrl = (host: string, tunnelId: string): string => {
  return `${host}/${tunnelId}`
}

type ParseUrlResult =
  | {
      status: 'error'
      reason: string
    }
  | {
      status: 'success'
      tunnelId: string
    }

export const parseUrl = (url: string | undefined): ParseUrlResult => {
  if (!url) {
    return { status: 'error', reason: 'url is empty' }
  }

  const match = url.match(URL_REGEX)
  if (!match) {
    return { status: 'error', reason: 'invalid url' }
  }

  const tunnelId = match[1] as string
  return { status: 'success', tunnelId }
}
