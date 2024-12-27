export type Tag = {
  type?: 'boolean' | 'string'
  description?: string
}

export type TagType = keyof typeof Tags

export const Tags = {
  bot: {},
  conversation: {
    upstream: {
      description:
        'Used for HITL as a convention. The upstream conversation ID, ie. the conversation ID of the original conversation'
    },
    downstream: {
      description:
        'Used for HITL as a convention. The downstream conversation ID, ie. the conversation ID of conversation in HITL channel'
    }
  },
  message: {
    origin: {
      description: 'The origin location of the message in the bot, eg. "workflow://[id]/node/[id]"'
    },
    iteration: {
      description: 'The LLMz iteration ID of the message, for tracking and debugging purposes'
    }
  },
  event: {},
  workflow: {},
  user: {},
  file: {
    system: {
      type: 'boolean',
      description: 'System files are managed by Botpress and should not be modified'
    },
    purpose: {
      description: 'The purpose of the file, eg. "swap"'
    },
    source: {
      description: 'The source of the file, eg. "knowledge-base"'
    },
    kbId: {
      description: 'The ID of the knowledge base'
    },
    favicon: {
      description: 'The favicon URL to display for the file, eg. "https://example.com/favicon.ico"'
    },
    pageUrl: {
      description: 'The original page URL of the file, eg. "https://example.com/page"'
    },
    integrationName: {
      description: 'The name of the integration that created the file'
    },
    webchatInjectConfigVersion: {
      description: 'The version of the webchat inject configuration (used by the dashboard)'
    }
  },
  table: {
    system: {
      type: 'boolean',
      description: 'System tables are managed by Botpress and should not be modified'
    },
    'x-studio-title': {
      description: 'Overrides the table title in the Studio'
    },
    'x-studio-readonly': {
      type: 'boolean',
      description: 'Prevents the table from being modified by the user in the Studio'
    },
    'x-studio-icon': {
      description: 'Overrides the table icon in the Studio. The value can be a lucide icon URL, eg. "lucide://atom"'
    },
    'x-studio-color': {
      description: 'Overrides the table color in the Studio.'
    },
    'x-studio-folder': {
      description: 'Groups the table in a folder in the Studio'
    },
    'x-studio-deletable': {
      type: 'boolean',
      description: 'Prevents the table from being deleted by the user in the Studio'
    }
  }
} as const satisfies Record<string, Record<string, Tag>>
