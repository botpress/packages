export const prefixToObjectMap = {
  action: 'action',
  anlytic: 'analytics',
  audit: 'audit',
  bak: 'botApiKey',
  bot: 'bot',
  devbot: 'devBot',
  card: 'card',
  cfg: 'configuration',
  channel: 'channel',
  conv: 'conversation',
  evt: 'event',
  file: 'file',
  flow: 'flow',
  iak: 'integrationApiKey',
  int: 'integration',
  intver: 'integrationVersion',
  devint: 'devIntegration',
  iss: 'issue',
  issevt: 'issueEvent',
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
  script: 'script',
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
  devBot: 'devbot',
  botApiKey: 'bak',
  card: 'card',
  channel: 'channel',
  configuration: 'cfg',
  conversation: 'conv',
  event: 'evt',
  file: 'file',
  flow: 'flow',
  integration: 'int',
  integrationApiKey: 'iak',
  integrationVersion: 'intver',
  devIntegration: 'devint',
  issue: 'iss',
  issueEvent: 'issevt',
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
  script: 'script',
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

type Ids = {
  [Id in Objects as `${Capitalize<Id>}Id`]: `${(typeof objectToPrefixMap)[Id]}_${string}`
}

export type ActionId = Ids['ActionId']
export type AnalyticsId = Ids['AnalyticsId']
export type AuditId = Ids['AuditId']
export type BotApiKeyId = Ids['BotApiKeyId']
export type BotId = Ids['BotId']
export type CardId = Ids['CardId']
export type ChannelId = Ids['ChannelId']
export type ConfigurationId = Ids['ConfigurationId']
export type ConversationId = Ids['ConversationId']
export type EventId = Ids['EventId']
export type FileId = Ids['FileId']
export type FlowId = Ids['FlowId']
export type IntegrationApiKeyId = Ids['IntegrationApiKeyId']
export type IntegrationId = Ids['IntegrationId']
export type Issue = Ids['IssueId']
export type IssueEvent = Ids['IssueEventId']
export type KnowledgeBaseId = Ids['KnowledgeBaseId']
export type LimitId = Ids['LimitId']
export type MediaId = Ids['MediaId']
export type MessageId = Ids['MessageId']
export type NodeId = Ids['NodeId']
export type PersonalAccessTokenId = Ids['PersonalAccessTokenId']
export type QuotaId = Ids['QuotaId']
export type RecurringEventId = Ids['RecurringEventId']
export type SandboxId = Ids['SandboxId']
export type SchemaId = Ids['SchemaId']
export type ScriptId = Ids['ScriptId']
export type StateId = Ids['StateId']
export type TableId = Ids['TableId']
export type TagId = Ids['TagId']
export type UsageId = Ids['UsageId']
export type UserId = Ids['UserId']
export type WebhookId = Ids['WebhookId']
export type WorkspaceId = Ids['WorkspaceId']

type Reverser<T extends Record<PropertyKey, PropertyKey>> = {
  [P in keyof T as T[P]]: P
}
