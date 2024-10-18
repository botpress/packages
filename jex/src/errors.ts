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

export class JexInvalidJsonSchemaError extends JexError {}

export class JexUnresolvedReferenceError extends JexError {
  public constructor(path: PropertyPath) {
    const pathString = pathToString(path)
    super(`Unresolved reference at ${pathString}`)
  }
}

// TODO: add a property path to explain where the error occurred in the schema
export class JexUnsuportedJsonSchemaError extends JexInvalidJsonSchemaError {
  public constructor(path: PropertyPath, schema: JSONSchema7Definition) {
    const pathString = pathToString(path)
    super(`Unsupported JSON schema at ${pathString}: ${JSON.stringify(schema)}`)
  }
}
