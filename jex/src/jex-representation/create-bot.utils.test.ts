import z from 'zod'
import * as types from './typings'

/**
 * ##################
 * ### Zod Schema ###
 * ##################
 */

const zodEventV1 = z.object({
  schemaVersion: z.literal('v1'),
  name: z.string(),
  description: z.string(),
  tags: z.record(z.string()),
  payload: z.record(z.any()),
})

const zodMessageReceivedEvent = {
  type: z.literal('message_received'),
  payload: z.object({
    message: z.string(),
  }),
}

const zodEmojiReceivedEvent = {
  type: z.literal('emoji_received'),
  payload: z.record(z.string()),
  date: z.date(),
}

const zodBaseEventV2 = z.object({
  eventVersion: z.literal('v2'),
})
const zodEventV2Schema = z.union([
  zodBaseEventV2.extend(zodMessageReceivedEvent),
  zodBaseEventV2.extend(zodEmojiReceivedEvent),
])

export const zodBotCreateSchema = z.object({
  name: z.string(),
  description: z.string(),
  tags: z.record(z.string()),
  events: z.record(z.union([zodEventV1, zodEventV2Schema])),
  scopes: z.array(z.string()),
})

/**
 * ##################
 * ### Jex Schema ###
 * ##################
 */

const jexEventV1: types.JexType = {
  type: 'object',
  properties: {
    schemaVersion: { type: 'string', value: 'v1' },
    name: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'map', items: { type: 'string' } },
    payload: { type: 'map', items: { type: 'any' } },
  },
}

const jexMessageReceivedEvent: types.JexType = {
  type: 'object',
  properties: {
    eventVersion: { type: 'string', value: 'v2' },
    type: { type: 'string', value: 'message_received' },
    payload: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
}

const jexEmojiReceivedEvent: types.JexType = {
  type: 'object',
  properties: {
    eventVersion: { type: 'string', value: 'v2' },
    type: { type: 'string', value: 'emoji_received' },
    payload: { type: 'map', items: { type: 'string' } },
    date: { type: 'string' },
  },
}

const jexEventV2: types.JexType = {
  type: 'union',
  anyOf: [jexMessageReceivedEvent, jexEmojiReceivedEvent],
}

export const jexBotCreateSchema: types.JexType = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
    tags: { type: 'map', items: { type: 'string' } },
    events: {
      type: 'map',
      items: { type: 'union', anyOf: [jexEventV1, jexEventV2] },
    },
    scopes: { type: 'array', items: { type: 'string' } },
  },
}
