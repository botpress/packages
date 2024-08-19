type Limit = {
  /**
   * The maximum value for the limit.
   */
  value: number
  /**
   * The unit of the limit.
   */
  unit: LimitUnit
}

export type LimitType = keyof typeof limitConfigs
export type LimitUnit = 'count' | 'bytes'

export const limitConfigs = {
  bot_configuration_bytes: {
    value: 20480, // 20 KB
    unit: 'bytes'
  },
  bot_installed_integrations_count: {
    value: 30,
    unit: 'count'
  },
  bot_integration_configuration_bytes: {
    value: 20480, // 20 KB
    unit: 'bytes'
  },
  bot_recurring_event_count: {
    value: 5,
    unit: 'count'
  },
  bot_recurring_event_payload_bytes: {
    value: 131072, // 128 KB
    unit: 'bytes'
  },
  event_definition_count: {
    value: 20,
    unit: 'count'
  },
  integration_channel_count: {
    value: 10,
    unit: 'count'
  },
  integration_channel_message_type_count: {
    value: 20,
    unit: 'count'
  },
  integration_identifier_count: {
    value: 50,
    unit: 'count'
  },
  integration_version_count: {
    value: 50,
    unit: 'count'
  },
  issue_event_item_payload_bytes: {
    value: 131072, // 128 KB
    unit: 'bytes'
  },
  message_payload_bytes: {
    value: 131072, // 128 KB
    unit: 'bytes'
  },
  schema_bytes: {
    value: 102400, // 100 KB
    unit: 'bytes'
  },
  state_definition_count: {
    value: 5,
    unit: 'count'
  },
  state_item_payload_bytes: {
    value: 131072, // 128 KB
    unit: 'bytes'
  },
  tag_definition_count: {
    value: 50,
    unit: 'count'
  },
  bot_integration_secret_count: {
    value: 25,
    unit: 'count'
  },
  files_api_query_bytes: {
    value: 2048, // 2 KB
    unit: 'bytes'
  },
  code_payload_bytes: {
    value: 52428800, // 50 MB
    unit: 'bytes'
  }
} as const satisfies Record<string, Limit>
