export type Quota = {
  /**
   * Friendly name of the usage type.
   */
  name: string
  /**
   * Description of the usage type.
   */
  description: string
  /**
   * The default limit for the usage type. This is the fallback value if the limit is not set.
   */
  default: number
  /**
   * The kind of usage type. This is used to determine the object linked to the usage type.
   */
  kind: QuotaKind
  /**
   * The usage category determine how the usage is calculated.
   */
  category: QuotaCategory
}

export type QuotaKind = 'workspace' | 'bot'
export type QuotaCategory = 'ratelimit' | 'count' | 'calls' | 'timeout'
export type QuotaType = (typeof quotaTypes)[number]

export const quotaTypes = [
  'invocation_timeout',
  'invocation_calls',
  'storage_count',
  'bot_count',
  'knowledgebase_vector_count',
  'bot_ratelimit',
  'table_row_count',
  'workspace_member_count'
] as const

export const quotaConfigs = {
  invocation_timeout: {
    name: 'Invocation Timeout',
    description: 'Maximum time in milliseconds a bot can run before timing out.',
    default: 60_000,
    kind: 'bot',
    category: 'timeout'
  },
  storage_count: {
    name: 'Storage Count',
    description: 'Maximum number of storage bytes that can be stored.',
    default: 104_857_600, // 100 MB
    kind: 'bot',
    category: 'count'
  },
  bot_count: {
    name: 'Bot Count',
    description: 'Maximum number of bots that can be created.',
    default: 5,
    kind: 'workspace',
    category: 'count'
  },
  workspace_member_count: {
    name: 'Workspace Member Count',
    description: 'Maximum number of members that can be added to a workspace.',
    default: 3,
    kind: 'workspace',
    category: 'count'
  },
  knowledgebase_vector_count: {
    name: 'Knowledgebase Vector Count',
    description: 'Maximum number of knowledgebase vectors that can be created.',
    default: 5_000,
    kind: 'bot',
    category: 'count'
  },
  table_row_count: {
    name: 'Table Row Count',
    description: 'Maximum number of rows that can be stored in a table.',
    default: 5_000,
    kind: 'bot',
    category: 'count'
  },
  invocation_calls: {
    name: 'Invocation Calls',
    description: 'Maximum number of times a bot can be invoked in a month.',
    default: 25_000,
    kind: 'bot',
    category: 'calls'
  },
  bot_ratelimit: {
    name: 'Bot Ratelimit',
    description: 'Maximum number of times a bot can be invoked in a minute.',
    default: 100,
    kind: 'bot',
    category: 'ratelimit'
  }
} as const satisfies Record<QuotaType, Quota>
