export class JexError extends Error {
  public constructor(public readonly message: string) {
    super(message)
  }
}
