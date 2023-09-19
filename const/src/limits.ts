export type LimitType = keyof typeof limitConfigs

export const limitConfigs = {
  bot_configuration_bytes: 20480, // 20 KB
  bot_installed_integrations_count: 30,
  bot_integration_configuration_bytes: 20480, // 20 KB
  bot_recurring_event_count: 5,
  bot_recurring_event_payload_bytes: 131072, // 128 KB
  event_definition_count: 20,
  integration_channel_count: 10,
  integration_channel_message_type_count: 20,
  integration_identifier_count: 50,
  integration_version_count: 50,
  integrations_owned_count: 20,
  message_payload_bytes: 131072, // 128 KB
  schema_bytes: 102400, // 100 KB
  state_definition_count: 5,
  state_item_payload_bytes: 131072, // 128 KB
  tag_definition_count: 50,
} as const satisfies Record<string, number>
