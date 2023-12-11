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
  /**
   * If true, the usage is tracked per bot. This is only applicable if the kind is workspace.
   */
  trackUsagePerBot: boolean
  /**
   * Parent quota type. This is used to determine the object linked to the usage type.
   */
  parent?: QuotaType
}

export type QuotaKind = 'workspace' | 'bot'
export type QuotaCategory = 'ratelimit' | 'count' | 'calls' | 'timeout' | 'credit'
export type QuotaType = (typeof quotaTypes)[number]

export const quotaTypes = [
  'invocation_timeout',
  'invocation_calls',
  'storage_count',
  'bot_count',
  'knowledgebase_vector_storage',
  'workspace_ratelimit',
  'table_row_count',
  'workspace_member_count',
  'integrations_owned_count',
  'ai_spend',
  'openai_spend',
  'bing_search_spend',
] as const satisfies Readonly<string[]>

export const quotaConfigs = {
  invocation_timeout: {
    name: 'Invocation Timeout',
    description: 'Maximum time in milliseconds a bot can run before timing out.',
    default: 60_000,
    kind: 'bot',
    category: 'timeout',
    trackUsagePerBot: false
  },
  storage_count: {
    name: 'Storage Count',
    description: 'Maximum number of storage bytes that can be stored.',
    default: 500_000_000, // 500 MB
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: true
  },
  bot_count: {
    name: 'Bot Count',
    description: 'Maximum number of bots that can be created.',
    default: 5,
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: false
  },
  workspace_member_count: {
    name: 'Workspace Member Count',
    description: 'Maximum number of members that can be added to a workspace.',
    default: 3,
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: false
  },
  knowledgebase_vector_storage: {
    name: 'Knowledgebase Vector Storage',
    description: 'Maximum size of knowledge base documents',
    default: 100_000_000, // 100 MB
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: true
  },
  table_row_count: {
    name: 'Table Row Count',
    description: 'Maximum number of rows that can be stored in a table.',
    default: 5_000,
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: true
  },
  invocation_calls: {
    name: 'Invocation Calls',
    description: 'Maximum number of times a bot can be invoked in a month.',
    default: 2_000,
    kind: 'workspace',
    category: 'calls',
    trackUsagePerBot: true
  },
  workspace_ratelimit: {
    name: 'Workspace Ratelimit',
    description: 'Maximum number of API calls per second for a workspace.',
    default: 100,
    kind: 'workspace',
    category: 'ratelimit',
    trackUsagePerBot: false
  },
  integrations_owned_count: {
    name: 'Owned Integrations Count',
    description: 'Maximum number of integrations that can be created.',
    default: 20,
    kind: 'workspace',
    category: 'count',
    trackUsagePerBot: false
  },
  ai_spend: {
    name: 'AI Spend',
    description:
      'Maximum amount of AI spend, expressed in nano-dollars (1 nano-dollar = $0.000000001) that can be used in a month.',
    default: 5_000_000_000,
    kind: 'workspace',
    category: 'credit',
    trackUsagePerBot: true
  },
  openai_spend: {
    name: 'OpenAI Spend',
    description:
      'Maximum amount of OpenAI spend, expressed in nano-dollars (1 nano-dollar = $0.000000001) that can be used in a month.',
    default: 5_000_000_000,
    kind: 'workspace',
    category: 'credit',
    trackUsagePerBot: true,
    parent: 'ai_spend'
  },
  bing_search_spend: {
    name: 'Bing Search Spend',
    description:
      'Maximum amount of Bing Search spend, expressed in nano-dollars (1 nano-dollar = $0.000000001) that can be used in a month.',
    default: 5_000_000_000,
    kind: 'workspace',
    category: 'credit',
    trackUsagePerBot: true,
    parent: 'ai_spend'
  },
} as const satisfies Record<QuotaType, Quota>
