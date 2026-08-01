const URL_REGEX = /^\/([\w|-]+)$/ // /:tunnelId
const PUBLIC_URL_REGEX = /^\/([\w|-]+)(\/[^?]*)(?:\?(.*))?$/ // /:tunnelId/:path[?query]

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

type ParsePublicUrlResult =
  | {
      status: 'error'
      reason: string
    }
  | {
      status: 'success'
      tunnelId: string
      path: string
      query?: string
    }

/**
 * A public visitor URL: the tunnel id followed by the path the visitor
 * targets on the tail (`/:tunnelId/:path[?query]`). Distinct from the
 * bare `/:tunnelId` a tail registers with.
 */
export const parsePublicUrl = (url: string | undefined): ParsePublicUrlResult => {
  if (!url) {
    return { status: 'error', reason: 'url is empty' }
  }

  const match = url.match(PUBLIC_URL_REGEX)
  if (!match) {
    return { status: 'error', reason: 'invalid url' }
  }

  const tunnelId = match[1] as string
  const path = match[2] as string
  const query = match[3] as string | undefined
  return { status: 'success', tunnelId, path, ...(query !== undefined && { query }) }
}
