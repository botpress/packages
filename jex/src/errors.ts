import { JSONParserError } from '@apidevtools/json-schema-ref-parser'

export class JexError extends Error {
  public constructor(public readonly message: string) {
    super(message)
  }
}

export class JexReferenceError extends JexError {
  public constructor(inner: ReferenceError) {
    super(inner.message)
  }
}

export class JexParserError extends JexError {
  public constructor(inner: JSONParserError) {
    super(inner.message)
  }
}
