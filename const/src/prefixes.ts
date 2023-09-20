export const prefixToObjectMap = {
  action: 'action',
  anlytic: 'analytics',
  audit: 'audit',
  bak: 'botApiKey',
  bot: 'bot',
  card: 'card',
  cfg: 'configuration',
  channel: 'channel',
  conv: 'conversation',
  evt: 'event',
  file: 'file',
  flow: 'flow',
  iak: 'integrationApiKey',
  integ: 'integration',
  kb: 'knowledgeBase',
  limit: 'limit',
  media: 'media',
  msg: 'message',
  node: 'node',
  pat: 'personalAccessToken',
  quota: 'quota',
  recevt: 'recurringEvent',
  sandbox: 'sandbox',
  schema: 'schema',
  state: 'state',
  table: 'table',
  tag: 'tag',
  usage: 'usage',
  user: 'user',
  webhook: 'webhook',
  wkspace: 'workspace'
} as const

export const objectToPrefixMap: Reverser<typeof prefixToObjectMap> = {
  action: 'action',
  analytics: 'anlytic',
  audit: 'audit',
  bot: 'bot',
  botApiKey: 'bak',
  card: 'card',
  channel: 'channel',
  configuration: 'cfg',
  conversation: 'conv',
  event: 'evt',
  file: 'file',
  flow: 'flow',
  integration: 'integ',
  integrationApiKey: 'iak',
  knowledgeBase: 'kb',
  limit: 'limit',
  media: 'media',
  message: 'msg',
  node: 'node',
  personalAccessToken: 'pat',
  quota: 'quota',
  recurringEvent: 'recevt',
  sandbox: 'sandbox',
  schema: 'schema',
  state: 'state',
  table: 'table',
  tag: 'tag',
  usage: 'usage',
  user: 'user',
  webhook: 'webhook',
  workspace: 'wkspace'
} as const

export type Prefixes = (typeof objectToPrefixMap)[keyof typeof objectToPrefixMap]
export type Objects = keyof typeof objectToPrefixMap

export type Ids = {
  [Id in Objects as `${Capitalize<Id>}Id`]: `${Id}_${string}`
}

type Reverser<T extends Record<PropertyKey, PropertyKey>> = {
  [P in keyof T as T[P]]: P
}