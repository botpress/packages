# Changelog

All notable changes to `@bpinternal/opapi` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html) starting with `1.0.0`.

## [Unreleased]

## [2.0.0] - 2026-07-22

### Changed

- **Breaking**: The `opapi` client generator no longer emits axios-based code. The generated `Client` now takes any transport implementing the generated `HttpClient` interface (`{ request: <T>(config: RequestConfig) => Promise<{ data: T }> }`) instead of an `AxiosInstance`. Like axios, the transport must reject on unsuccessful http statuses, exposing the parsed error body under `response.data` on the thrown error so the generated client can map it to an api error.
- **Breaking**: The generated `to-axios.ts` file is now `to-request.ts`, `toAxiosRequest` is now `toRequest` (returning a `RequestConfig` instead of an `AxiosRequestConfig`), and the `ClientProps.toAxiosRequest` override is now `ClientProps.toRequest`.
- **Breaking**: The generated handler no longer imports `isAxiosError` from axios; it detects http errors structurally (any `Error` with a `response` property).
- The generated `toApiError` detects http errors structurally (`err.response.data`) instead of using `axios.isAxiosError`, so it works with any transport including axios.
- The generated `errors.ts` no longer imports the node `crypto` module: it uses `globalThis.crypto` when available (browsers, web workers, node >= 19, edge runtimes) and falls back to a `Math.random`-based polyfill otherwise, so generated clients have no node builtin dependencies.

#### Examples

```ts
// Generated clients are now transport-agnostic. Bring any http client that
// implements the generated `HttpClient` interface — for example a fetch-based one:
import { Client } from './gen'

const httpClient = {
  request: async <T>(config: { method: string; url: string; headers: Record<string, string>; data?: any }) => {
    const res = await fetch(`https://api.example.com${config.url}`, {
      method: config.method,
      headers: config.headers,
      body: config.data ? JSON.stringify(config.data) : undefined,
    })
    const data = await res.json()
    if (!res.ok) {
      // the generated client maps rejections carrying `response.data` to api errors
      throw Object.assign(new Error(`Request failed with status code ${res.status}`), {
        response: { status: res.status, data },
      })
    }
    return { data: data as T }
  },
}

const client = new Client(httpClient)
```

### Fixed

- Fixed spelling mistakes in package files.

## [1.0.0] - 2025-11-10

### Changed

- Refactored `OpenApi` from a factory-style function into a class with instance methods.
- Replaced the old `OpenApi.fromState` namespace function shape with the class static method `OpenApi.fromState`.
- Renamed client generation options from `GenerateClientProps` to `GenerateClientOptions`.

#### Examples

```ts
import { GenerateClientOptions, OpenApi, createState } from '@bpinternal/opapi'

// `OpenApi` is now a class, so create API instances with `new`.
const api = new OpenApi({ metadata })

const state = createState({ metadata })

// `fromState` is now a static method on the `OpenApi` class.
const apiFromState = OpenApi.fromState(state)

// Client generation options are now typed as `GenerateClientOptions`.
const clientOptions: GenerateClientOptions = { generator: 'opapi' }
await api.exportClient('./gen/client', clientOptions)
```

### Added

- Exported `CreateStateProps` for callers that need to type `OpenApi` constructor input.

#### Examples

```ts
import { CreateStateProps, OpenApi, schema } from '@bpinternal/opapi'
import { z } from 'zod'

// `CreateStateProps` can now be imported to type constructor input.
type SchemaName = 'User'
type DefaultParameterName = 'workspaceId'
type SectionName = 'Users'

const props: CreateStateProps<SchemaName, DefaultParameterName, SectionName> = {
  metadata: { title: 'API', description: 'Example API', server: 'https://api.example.com', version: '1.0.0' },
  defaultParameters: {
    workspaceId: { in: 'header', type: 'string', description: 'Workspace ID', required: true },
  },
  schemas: {
    User: { section: 'Users', schema: schema(z.object({ id: z.string() })) },
  },
  sections: {
    Users: { title: 'Users', description: 'User endpoints' },
  },
}

const api = new OpenApi(props)
```

### Removed

- Removed the generated `getState()` method from `OpenApi` instances.
- Removed the exported `OpenApiProps` and `GenerateClientProps` types.
- Removed the legacy `exportClient(dir, endpoint, props)` overload; pass `{ generator: 'openapi-generator', endpoint, ... }` instead.

## [0.18.0] - 2025-11-07

### Added

- Added export-time state filtering options.
- Added `ignoreDefaultParameters` to omit default parameters from generated outputs.
- Added `ignoreSecurity` to omit security configuration from generated outputs.

#### Examples

```ts
// These options remove default parameters and security from this export only.
api.exportOpenapi('./gen/openapi', { ignoreDefaultParameters: true, ignoreSecurity: true })
api.exportState('./gen/state', { ignoreSecurity: true })
```

## [0.17.1] - 2025-11-06

### Fixed

- Fixed OpenAPI tag generation so tags are globally defined.

## [0.17.0] - 2025-11-05

### Added

- Added operation tags support.
- Added deprecated operation metadata support.

#### Examples

```ts
api.addOperation({
  name: 'listLegacyUsers',
  method: 'get',
  path: '/legacy/users',
  description: 'List legacy users',
  // `tags` and `deprecated` are emitted into the generated OpenAPI operation.
  tags: ['Users', 'Legacy'],
  deprecated: true,
  response: { description: 'Legacy users', schema: z.object({ users: z.array(z.unknown()) }) },
})
```

## [0.16.1] - 2025-10-29

### Fixed

- Limited generated security schemes to only the schemes required by the API state.

## [0.16.0] - 2025-10-29

### Added

- Added API security support, including bearer and basic authentication metadata.

#### Examples

```ts
const api = new OpenApi({
  metadata,
  // Declare globally supported security schemes for generated OpenAPI output.
  security: ['BearerAuth'],
})

api.addOperation({
  name: 'getAccount',
  method: 'get',
  path: '/account',
  description: 'Get the authenticated account',
  // Require bearer auth for this operation.
  security: ['BearerAuth'],
  response: { description: 'Account', schema: z.object({ id: z.string() }) },
})
```

## [0.15.1] - 2025-10-27

### Fixed

- Fixed generated type casing for names that contain numbers.

## [0.15.0] - 2025-10-22

### Added

- Added support for HTTP `410 Gone` API errors.

#### Examples

```ts
const api = new OpenApi({
  metadata,
  // 410 is now accepted as an API error status.
  errors: [{ status: 410, type: 'Gone', description: 'The resource is no longer available.' }],
})
```

## [0.14.1] - 2025-07-18

### Changed

- Updated package infrastructure and dependency metadata.

## [0.14.0] - 2025-04-09

### Added

- Added support for configuring a custom generated API error mapping function.

#### Examples

```ts
import { Client } from './gen/client'

const client = new Client(axiosInstance, {
  // Override how generated clients map thrown/request errors.
  toApiError: (error) => new Error(`Request failed: ${String(error)}`),
})
```

## [0.13.0] - 2025-04-01

### Added

- Added support for passing a custom AJV instance to generated handlers.

#### Examples

```ts
import Ajv from 'ajv'
import { createRouteTree } from './gen/handler'

// Pass a configured AJV instance into generated handler route trees.
const ajv = new Ajv({ allErrors: true })
const routes = createRouteTree(operations, ajv)
```

## [0.12.2] - 2025-02-21

### Fixed

- Fixed generated operation input types for POST requests with empty bodies.

## [0.12.1] - 2025-02-03

### Fixed

- Prevented generated clients from sending request bodies with GET requests.

## [0.12.0] - 2024-12-19

### Added

- Added metadata support on generated API errors.

#### Examples

```ts
import { ForbiddenError } from './gen/errors'

// The fourth constructor argument is serialized as API error metadata.
throw new ForbiddenError('Access denied', undefined, undefined, { resourceId: 'user_123' })
```

## [0.11.1] - 2024-12-18

### Fixed

- Added HTTP `424 Failed Dependency` to generated `ApiError.status` typing and type guards.

## [0.11.0] - 2024-12-17

### Added

- Added HTTP `424 Failed Dependency` as a supported API error status code.

#### Examples

```ts
const api = new OpenApi({
  metadata,
  // 424 is now accepted as an API error status.
  errors: [{ status: 424, type: 'DependencyFailed', description: 'An upstream dependency failed.' }],
})
```

## [0.10.30] - 2024-12-03

### Changed

- Updated dependencies.

## [0.10.29] - 2024-11-11

### Changed

- Updated dependencies and package documentation metadata.

## [0.10.28] - 2024-10-16

### Changed

- Updated dependencies.

## [0.10.27] - 2024-10-07

### Changed

- Updated dependencies.

## [0.10.26] - 2024-09-30

### Changed

- Updated dependencies.

## [0.10.25] - 2024-09-26

### Changed

- Reverted package manager metadata back to pnpm 8.

## [0.10.24] - 2024-09-25

### Changed

- Updated dependencies.

## [0.10.23] - 2024-09-05

### Added

- Added API version information to generated clients.

#### Examples

```ts
import { apiVersion } from './gen/client'

// Generated clients now export the API version from metadata.version.
console.log(apiVersion)
```

## [0.10.22] - 2024-08-20

### Fixed

- Adjusted generated API error handling behavior.

## [0.10.21] - 2024-08-20

### Fixed

- Improved generated client error messages to expose the real underlying error message.

## [0.10.20] - 2024-07-24

### Added

- Added support for exporting arbitrary schemas.

#### Examples

```ts
import { exportJsonSchemas, exportZodSchemas } from '@bpinternal/opapi'

// Export standalone schemas without creating a full OpenApi instance.
await exportJsonSchemas({ user: { type: 'object', properties: { id: { type: 'string' } } } })('./gen/schemas')
await exportZodSchemas({ ticket: z.object({ title: z.string() }) })('./gen/zod-schemas')
```

## [0.10.19] - 2024-06-10

### Changed

- Updated dependencies.

## [0.10.18] - 2024-05-23

### Fixed

- Fixed generated handler support for nullable properties.

## [0.10.17] - 2024-05-21

### Fixed

- Removed empty query strings from generated client requests when no query parameters are present.

## [0.10.16] - 2024-05-21

### Added

- Added an option to override the generated `toAxiosReq` function.

#### Examples

```ts
import { Client } from './gen/client'

const client = new Client(axiosInstance, {
  // Override how generated operation requests are converted to Axios requests.
  toAxiosRequest: (request) => ({
    method: request.method,
    url: `/custom-prefix${request.path}`,
    params: request.query,
    data: request.body,
  }),
})
```

## [0.10.15] - 2024-05-06

### Fixed

- Deep-copied schemas before applying OpenAPI properties to avoid mutating shared schema objects.

## [0.10.14] - 2024-04-23

### Changed

- Refined generated handler output.
- Updated dependencies.

## [0.10.13] - 2024-04-23

### Changed

- Updated dependencies.

## [0.10.12] - 2024-04-22

### Fixed

- Improved compatibility between the new client generator and older Axios versions.

## [0.10.11] - 2024-04-22

### Fixed

- Fixed minor issues in generated client output.

## [0.10.10] - 2024-04-20

### Fixed

- Fixed additional generated client issues after the new client generator release.

## [0.10.9] - 2024-04-19

### Fixed

- Fixed generated Axios request formatting in the new client generator.

## [0.10.8] - 2024-04-19

### Fixed

- Improved nullable schema conversion to TypeScript unions.

## [0.10.7] - 2024-04-19

### Fixed

- Fixed additional generated client issues after the new client generator release.

## [0.10.6] - 2024-04-19

### Fixed

- Generated property access now uses square brackets where needed for safer emitted code.

## [0.10.5] - 2024-04-18

### Fixed

- Fixed follow-up issues in the new client generator.

## [0.10.4] - 2024-04-18

### Fixed

- Fixed follow-up issues in the new client generator.

## [0.10.3] - 2024-04-18

### Added

- Added the new Opapi TypeScript client generator.

#### Examples

```ts
// Generate the Opapi-native TypeScript client instead of using openapi-generator.
await api.exportClient('./gen/client', { generator: 'opapi' })
```

## [0.10.2] - 2024-04-18

### Changed

- Updated package manager metadata and dependencies.

## [0.10.1] - 2024-04-17

### Changed

- Updated dependencies.

## [0.10.0] - 2024-04-11

### Added

- Added support for generating non-Express handlers.

#### Examples

```ts
// Generate framework-neutral handler types and routing helpers.
await api.exportHandler('./gen/handler')
```

## [0.9.1] - 2024-04-05

### Changed

- Updated dependencies.

## [0.9.0] - 2024-04-03

### Added

- Added support for numeric request parameters.

#### Examples

```ts
api.addOperation({
  name: 'listInvoices',
  method: 'get',
  path: '/invoices',
  description: 'List invoices',
  // Query parameters can now be declared as numeric values.
  parameters: { limit: { in: 'query', type: 'number', description: 'Maximum invoices to return' } },
  response: { description: 'Invoices', schema: z.object({ invoices: z.array(z.unknown()) }) },
})
```

## [0.8.1] - 2024-03-18

### Changed

- Updated dependencies.

## [0.8.0] - 2024-03-13

### Added

- Added support for binary request and response content types.

#### Examples

```ts
api.addOperation({
  name: 'downloadFile',
  method: 'get',
  path: '/files/{id}',
  description: 'Download a file',
  // `format: 'binary'` marks the generated response as binary content.
  response: { description: 'File bytes', schema: z.instanceof(Buffer), format: 'binary' },
})
```

## [0.7.10] - 2024-03-06

### Changed

- Updated dependencies.

## [0.7.9] - 2024-03-05

### Fixed

- Embedded required `type-fest` types in generated output.

## [0.7.8] - 2024-03-04

### Changed

- Updated `winston` dependency.

## [0.7.7] - 2024-02-29

### Changed

- Fixed package metadata after dependency updates.

## [0.7.6] - 2024-02-29

### Changed

- Updated Node type dependencies.

## [0.7.5] - 2024-02-29

### Fixed

- Reverted package changes involving ESM-only modules.

## [0.7.4] - 2024-02-29

### Fixed

- Reverted a broken package setup after dependency updates.

## [0.7.3] - 2024-02-28

### Changed

- Updated Opapi dependencies and test tooling.

## [0.7.2] - 2024-01-20

### Fixed

- Allowed `any` to be used when generating server types.

## [0.7.1] - 2024-01-18

### Changed

- Reverted a previous package change.

## [0.7.0] - 2024-01-18

### Changed

- Updated Opapi libraries.

## [0.6.3] - 2024-01-04

### Fixed

- Removed `getState` from the public Opapi object.

## [0.6.2] - 2023-12-07

### Added

- Added support for boolean parameters.

#### Examples

```ts
api.addOperation({
  name: 'listUsers',
  method: 'get',
  path: '/users',
  description: 'List users',
  // Query parameters can now be declared as booleans.
  parameters: { active: { in: 'query', type: 'boolean', description: 'Only active users' } },
  response: { description: 'Users', schema: z.object({ users: z.array(z.unknown()) }) },
})
```

## [0.6.1] - 2023-12-06

### Fixed

- Fixed generated error ID timestamp parsing.

## [0.6.0] - 2023-12-04

### Added

- Generated better API error IDs.

#### Examples

```ts
import { ForbiddenError } from './gen/errors'

const error = new ForbiddenError('Access denied')
// Generated error IDs use the improved ID format.
console.log(error.id)
```

## [0.5.1] - 2023-10-03

### Added

- Added support for accessing API state without exporting it.

#### Examples

```ts
// Access the in-memory state without writing it to disk.
const state = api.getState()
const hydratedApi = OpenApi.fromState(state)
```

## [0.5.0] - 2023-09-20

### Added

- Added support for unions in request bodies and responses.

#### Examples

```ts
// `allowUnions` enables z.union schemas in requests and responses.
const api = new OpenApi({ metadata }, { allowUnions: true })

api.addOperation({
  name: 'upsertSubject',
  method: 'post',
  path: '/subjects',
  description: 'Create a user or team',
  requestBody: {
    description: 'Subject',
    schema: z.union([z.object({ userId: z.string() }), z.object({ teamId: z.string() })]),
  },
  response: {
    description: 'Subject',
    schema: z.union([z.object({ userId: z.string() }), z.object({ teamId: z.string() })]),
  },
})
```

### Fixed

- Improved state backward compatibility and version handling.

## [0.4.5] - 2023-09-20

### Added

- Added a section type generator.

#### Examples

```ts
// Generate TypeScript types grouped by documentation section.
await api.exportTypesBySection('./gen/sections')
```

## [0.3.4] - 2023-09-13

### Added

- Added generated error exports from Opapi state.

#### Examples

```ts
// Generate typed error classes from the API error state.
api.exportErrors('./gen/errors')
```

## [0.3.3] - 2023-08-29

### Fixed

- Used a `crypto.getRandomValues()` polyfill in generated error handling for older environments.

## [0.3.2] - 2023-08-29

### Fixed

- Fixed crypto library selection in generated error handling code.

## [0.3.1] - 2023-08-24

### Fixed

- Fixed generated client and generated error handling code.

## [0.3.0] - 2023-08-14

### Added

- Generated API error IDs automatically when API errors are instantiated.

#### Examples

```ts
import { InternalError } from './gen/errors'

const error = new InternalError('Unexpected failure')
// IDs are generated automatically when no ID is passed.
console.log(error.id)
```

## [0.2.6] - 2023-08-09

### Fixed

- Fixed parsing of properties with similar names.

## [0.2.5] - 2023-08-03

### Fixed

- Fixed missing imports for schemas that depend on other schemas.

## [0.2.4] - 2023-08-02

### Fixed

- Fixed `exportTypesBySection` errors when parsing refs.

## [0.2.3] - 2023-07-31

### Added

- Added support for generating TypeScript types from schemas.

#### Examples

```ts
// Generate TypeScript types from the schemas registered on the API.
await api.exportTypesBySection('./gen/types')
```

## [0.2.2] - 2023-07-18

### Fixed

- Allowed empty request bodies for POST requests.

## [0.2.1] - 2023-06-02

### Fixed

- Added default type arguments for easier OpenAPI typing.

## [0.2.0] - 2023-06-02

### Added

- Added support for exporting Opapi state.

#### Examples

```ts
// Export the normalized Opapi state as TypeScript.
api.exportState('./gen/state')
```

## [0.1.4] - 2023-05-30

### Fixed

- Fixed duplicate generated `Handler` types.

## [0.1.3] - 2023-05-30

### Fixed

- Fixed generated files so they build successfully.

## [0.1.2] - 2023-04-28

### Added

- Added more HTTP error codes.

#### Examples

```ts
const api = new OpenApi({
  metadata,
  // Additional HTTP error statuses can be declared in API errors.
  errors: [{ status: 429, type: 'RateLimited', description: 'Too many requests.' }],
})
```

## [0.1.1] - 2023-04-27

### Added

- Added an `isApiError` field to generated errors.

#### Examples

```ts
import { ForbiddenError } from './gen/errors'

const error = new ForbiddenError('Access denied')
// Generated errors expose an `isApiError` marker field.
console.log(error.isApiError)
```

## [0.1.0] - 2023-04-07

### Added

- Initial public release of `@bpinternal/opapi`.

#### Examples

```ts
import { OpenApi, schema } from '@bpinternal/opapi'
import { z } from 'zod'

// Define an API with metadata, schemas, and documentation sections.
const api = new OpenApi({
  metadata: { title: 'Example API', description: 'Example', server: 'https://api.example.com', version: '0.1.0' },
  schemas: { User: { section: 'Users', schema: schema(z.object({ id: z.string() })) } },
  sections: { Users: { title: 'Users', description: 'User endpoints' } },
})
```
