import type { ApiError } from '../state'

const codes = {
  HTTP_STATUS_BAD_REQUEST: 400,
  HTTP_STATUS_UNAUTHORIZED: 401,
  HTTP_STATUS_PAYMENT_REQUIRED: 402,
  HTTP_STATUS_FORBIDDEN: 403,
  HTTP_STATUS_NOT_FOUND: 404,
  HTTP_STATUS_METHOD_NOT_ALLOWED: 405,
  HTTP_STATUS_REQUEST_TIMEOUT: 408,
  HTTP_STATUS_CONFLICT: 409,
  HTTP_STATUS_PAYLOAD_TOO_LARGE: 413,
  HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE: 415,
  HTTP_STATUS_TOO_MANY_REQUESTS: 429,
  HTTP_STATUS_INTERNAL_SERVER_ERROR: 500,
  HTTP_STATUS_NOT_IMPLEMENTED: 501,
  HTTP_STATUS_BAD_GATEWAY: 502,
  HTTP_STATUS_SERVICE_UNAVAILABLE: 503,
  HTTP_STATUS_GATEWAY_TIMEOUT: 504,
} as const

export function generateErrors(errors: ApiError[]) {
  const types = errors.map((error) => error.type)

  return `
import crypto from 'crypto'

const codes = {
${Object.entries(codes)
  .map(([name, code]) => `  ${name}: ${code},`)
  .join('\n')}
} as const

type ErrorCode = typeof codes[keyof typeof codes]

declare const window: any
type CryptoLib = { getRandomValues(array: Uint8Array): Uint8Array }

const cryptoLibPolyfill: CryptoLib = {
  // Fallback in case crypto isn't available.
  getRandomValues: (array: Uint8Array) => new Uint8Array(array.map(() => Math.floor(Math.random() * 256))),
}

let cryptoLib: CryptoLib =
  typeof window !== 'undefined' && typeof window.document !== 'undefined'
    ? window.crypto // Note: On browsers we need to use window.crypto instead of the imported crypto module as the latter is externalized and doesn't have getRandomValues().
    : crypto

if (!cryptoLib.getRandomValues) {
  // Use a polyfill in older environments that have a crypto implementaton missing getRandomValues()
  cryptoLib = cryptoLibPolyfill
}

abstract class BaseApiError<Code extends ErrorCode, Type extends string, Description extends string> extends Error {
  public readonly isApiError = true

  constructor(
    public readonly code: Code,
    public readonly description: Description,
    public readonly type: Type,
    public override readonly message: string,
    public readonly error?: Error,
    public readonly id?: string
  ) {
    super(message)

    if (!this.id) {
      this.id = BaseApiError.generateId()
    }
  }

  format() {
    return \`[\${this.type}] \${this.message} (Error ID: \${this.id})\`
  }

  toJSON() {
    return {
      id: this.id,
      code: this.code,
      type: this.type,
      message: this.message,
    }
  }

  static generateId() {
    const prefix = this.getPrefix();
    const timestamp = new Date().toISOString().replace(/[\\-:TZ]/g, "").split(".")[0] // UTC time in YYMMDDHHMMSS format

    const randomSuffixByteLength = 4
    const randomHexSuffix = Array.from(cryptoLib.getRandomValues(new Uint8Array(randomSuffixByteLength)))
      .map(x => x.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
    
    return \`\${prefix}_\${timestamp}x\${randomHexSuffix}\`
  }

  private static getPrefix() {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      // Browser environment
      return 'err_bwsr'
    }
    return 'err'
  }
}

const isObject = (obj: unknown): obj is object => typeof obj === 'object' && !Array.isArray(obj) && obj !== null

export const isApiError = (thrown: unknown): thrown is ApiError => {
  return thrown instanceof BaseApiError || isObject(thrown) && (thrown as ApiError).isApiError === true
}

${errors.map((err) => generateError(err)).join('\n')}
${generateErrorType(types)}
${generateApiError(types)}
${generateErrorTypeMap(types)}
export const errorFrom = (err: unknown): ApiError => {
  if (isApiError(err)) {
    return err
  }
  else if (err instanceof Error) {
    return new UnknownError(err.message, err)
  }
  else if (typeof err === 'string') {
    return new UnknownError(err)
  }
  else {
    return getApiErrorFromObject(err)
  }
}

function getApiErrorFromObject(err: any) {
  // Check if it's an deserialized API error object
  if (typeof err === 'object' && 'code' in err && 'type' in err && 'id' in err && 'message' in err && typeof err.type === 'string' && typeof err.message === 'string') {
    const ErrorClass = errorTypes[err.type]
    if (!ErrorClass) {
      return new UnknownError(\`An unclassified API error occurred: \${err.message} (Type: \${err.type}, Code: \${err.code})\`)
    }

    return new ErrorClass(err.message, undefined, <string>err.id || 'UNKNOWN') // If error ID was not received do not pass undefined to generate a new one, flag it as UNKNOWN so we can fix the issue.
  }

  return new UnknownError('An invalid error occurred: ' + JSON.stringify(err))
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
  constructor(message: string, error?: Error, id?: string) {
    super(${error.status}, '${description}', '${error.type}', message, error, id)
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
  return `const errorTypes: { [type: string]: new (message: string, error?: Error, id?: string) => ApiError } = {
${types.map((type) => `  ${type}: ${type}Error,`).join('\n')}
}\n`
}
