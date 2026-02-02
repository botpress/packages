export type SignatureNonceRegistry = Disposable & {
  isReplayedRequest(params: { signatureHash: string; timestamp: number }): boolean | Promise<boolean>
}

export type RedisClient = {
  set(key: string, value: string | number, ...args: unknown[]): Promise<'OK' | null>
}
