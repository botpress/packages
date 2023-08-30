export const prefixes = {
  personalAccessToken: 'pat',
  botApiKey: 'bak',

  user: 'user',
  conversation: 'cnv',
  message: 'msg',
  messages: 'msg',
} as const

type Prefixes = typeof prefixes[keyof typeof prefixes]
