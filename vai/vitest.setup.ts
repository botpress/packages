import { beforeAll } from 'vitest'
import { setupClient } from './src/hooks/setupClient'
import { Client } from '@botpress/client'

beforeAll(async () => {
  setupClient(
    new Client({
      apiUrl: process.env.CLOUD_API_ENDPOINT ?? 'https://api.botpress.dev',
      botId: process.env.CLOUD_BOT_ID,
      token: process.env.CLOUD_PAT
    })
  )
})
