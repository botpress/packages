import express from 'express'
import { AnyEndpoint } from './typings'

export type EndpointMw = { type: 'endpoint'; endpoint: AnyEndpoint }
export type ErrorHandlingMw = { type: 'error'; handler: express.ErrorRequestHandler }
export type Middleware = EndpointMw | ErrorHandlingMw

export namespace guards {
  export const endpoint = (m: Middleware): m is EndpointMw => m.type === 'endpoint'
  export const error = (m: Middleware): m is ErrorHandlingMw => m.type === 'error'
}
