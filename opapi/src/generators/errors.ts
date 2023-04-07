import type { ApiError } from '../state'

export function generateErrors(errors: ApiError[]) {
  const types = errors.map((error) => error.type)

  return `
const codes = {
  HTTP_STATUS_BAD_REQUEST: 400,
  HTTP_STATUS_UNAUTHORIZED: 401,
  HTTP_STATUS_PAYMENT_REQUIRED: 402,
  HTTP_STATUS_FORBIDDEN: 403,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_METHOD_NOT_ALLOWED: 405,
  HTTP_STATUS_CONFLICT: 409,
  HTTP_STATUS_PAYLOAD_TOO_LARGE: 413,
  HTTP_STATUS_TOO_MANY_REQUESTS: 429,
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500,
} as const

type ErrorCode = typeof codes[keyof typeof codes]

abstract class BaseApiError<Code extends ErrorCode, Type extends string, Description extends string> extends Error {
  constructor(
    public readonly code: Code,
    public readonly description: Description,
    public readonly type: Type,
    public override readonly message: string,
    public readonly error?: Error
  ) {
    super(message)
  }

  toJSON() {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
    }
  }
}

export const isApiError = (thrown: unknown): thrown is ApiError => {
  return thrown instanceof BaseApiError 
}

${errors.map((err) => generateError(err)).join('\n')}
${generateErrorType(types)}
${generateApiError(types)}
${generateErrorTypeMap(types)}
export const errorFrom = (err: unknown): ApiError => {
  if (err instanceof BaseApiError) {
    return err
  }

  if (err instanceof Error) {
    return new UnknownError(err.message, err)
  }

  if (err === null) {
    return new UnknownError('An unknown error occurred')
  }

  if (typeof err === 'string') {
    return new UnknownError(err)
  }

  if (typeof err !== 'object') {
    return new UnknownError('An unknown error occurred')
  }

  return getErrorFromObject(err)
}

function getErrorFromObject(err: object) {
  if ('code' in err && 'type' in err && 'message' in err) {
    if (typeof err.message !== 'string') {
      return new UnknownError('An unknown error occurred')
    }

    if (typeof err.type !== 'string') {
      return new UnknownError(err.message)
    }

    const ErrorClass = errorTypes[err.type]

    if (!ErrorClass) {
      return new UnknownError(err.message)
    }

    return new ErrorClass(err.message)
  }

  return new UnknownError('An unknown error occurred')
}
`
}

function generateError(error: ApiError) {
  const description = error.description.replace("'", "\\'")

  return `type ${error.type}Type = '${error.type}'

/**
 *  ${description}
 */
export class ${error.type}Error extends BaseApiError<${error.status}, ${error.type}Type, '${description}'> {
  constructor(message: string, error?: Error) {
    super(${error.status}, '${description}', '${error.type}', message, error)
  }
}\n`
}

function generateErrorType(types: string[]) {
  return `export type ErrorType =\n${types.map((type) => `  | '${type}'`).join('\n')}\n`
}

function generateApiError(types: string[]) {
  return `export type ApiError =\n${types.map((type) => `  | ${type}Error`).join('\n')}\n`
}

function generateErrorTypeMap(types: string[]) {
  return `const errorTypes: { [type: string]: new (message: string, error?: Error) => ApiError } = {
${types.map((type) => `  ${type}: ${type}Error,`).join('\n')}
}\n`
}
