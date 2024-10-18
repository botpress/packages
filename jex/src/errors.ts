import { JSONParserError } from '@apidevtools/json-schema-ref-parser'
import { JSONSchema7Definition } from 'json-schema'
import { pathToString, PropertyPath } from './property-path'

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

export class JexInvalidJsonSchemaError extends JexError {
  public constructor(
    public readonly path: PropertyPath,
    message: string
  ) {
    super(message)
  }
}

export class JexUnresolvedReferenceError extends JexInvalidJsonSchemaError {
  public constructor(path: PropertyPath) {
    const pathString = pathToString(path)
    super(path, `Unresolved reference at ${pathString}`)
  }
}

export class JexUnsuportedJsonSchemaError extends JexInvalidJsonSchemaError {
  public constructor(path: PropertyPath, schema: JSONSchema7Definition) {
    const pathString = pathToString(path)
    super(path, `Unsupported JSON schema at ${pathString}: ${JSON.stringify(schema)}`)
  }
}
