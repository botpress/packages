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
export type QuotaCategory = 'ratelimit' | 'count' | 'calls' | 'timeout' | 'credit'
export type QuotaType = (typeof quotaTypes)[number]

export const quotaTypes = [
  'invocation_timeout',
  'invocation_calls',
  'storage_count',
  'bot_count',
  'knowledgebase_vector_count',
  'bot_ratelimit',
  'table_row_count',
  'workspace_member_count',
  'integrations_owned_count',
  'cognitive_calls',
  'model_credit',
  'token_spend',
  'document_count',
] as const satisfies Readonly<string[]>

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
  document_count: {
    name: 'Document Count',
    description: 'Maximum number of documents in bytes that can be stored.',
    default: 104_857_600, // 100 MB
    kind: 'bot',
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
  cognitive_calls: {
    name: 'Cognitive Calls',
    description: 'Maximum number of times a cognitive service can be called in a month.',
    default: 4_000,
    kind: 'bot',
    category: 'calls'
  },
  bot_ratelimit: {
    name: 'Bot Ratelimit',
    description: 'Maximum number of times a bot can be invoked in a minute.',
    default: 100,
    kind: 'bot',
    category: 'ratelimit'
  },
  integrations_owned_count: {
    name: 'Owned Integrations Count',
    description: 'Maximum number of integrations that can be created.',
    default: 20,
    kind: 'workspace',
    category: 'count'
  },
  model_credit: {
    name: 'Model Credit',
    description: 'Maximum amount of ai model credit that can be used in a month.',
    default: 5000,
    kind: 'bot',
    category: 'credit'
  },
  token_spend: {
    name: 'Token Spend',
    description:
      'Maximum amount of token spend, expressed in nano-dollars (1 nano-dollar = $0.000000001) that can be used in a month.',
    default: 5_000_000_000,
    kind: 'workspace',
    category: 'credit'
  }
} as const satisfies Record<QuotaType, Quota>
