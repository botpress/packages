export const CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  INVALID_TUNNEL_ID: 4000,
  TUNNEL_ID_CONFLICT: 4001,
  INVALID_RESPONSE_PAYLOAD: 4002,
  INVALID_REQUEST_PAYLOAD: 4003,
  INTERNAL_TAIL_ERROR: 4004,
  INTERNAL_HEAD_ERROR: 4005,
} as const

export class TunnelError extends Error {
  public constructor(public readonly code: number, reason: string) {
    super(reason)
  }
}
