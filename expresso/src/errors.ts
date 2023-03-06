import { HttpError } from 'http-errors'
import { z } from 'zod'

export abstract class ExpressoError extends Error {
  constructor(message: string, public readonly code: number) {
    super(message)
  }
}

export class HTTPError extends ExpressoError {
  constructor({ message, statusCode }: HttpError) {
    super(message, statusCode)
  }
}

export abstract class InvalidRequestFormatError extends ExpressoError {
  constructor(message: string, public readonly error: z.ZodError) {
    super(message, 422)
  }
}

export class InvalidRequestBodyFormatError extends InvalidRequestFormatError {
  constructor(err: z.ZodError) {
    super(`Invalid Request Body Format Error: "${err.message}"`, err)
  }
}

export class InvalidRequestHeadersFormatError extends InvalidRequestFormatError {
  constructor(headerName: string, headerValue: string | string[] | undefined, err: z.ZodError) {
    super(`Invalid Request Headers Format Error (${headerName}): "${err.message}"`, err)
  }
}
