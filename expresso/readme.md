# Expresso

## Description

Small wrapper above [express](https://www.npmjs.com/package/express) that uses [zod](https://www.npmjs.com/package/zod) to add the following features:

- it can auto generate your documentation and openapi specification.
- it validates input requests.
- it adds a bunch of typings so TypeScript can help your detect dumb errors.

# Usage

### 1. Create Zod Schemas

```ts
import { z } from 'zod'

export const zError = z.object({ type: z.string(), code: z.number(), message: z.string() })
export const zSuccessResponse = z.object({ status: z.literal('success') })
export const zErrorResponse = z.object({ status: z.literal('error'), error: zError })

export const zCompileBody = z.object({ book: z.object({...}) })
export const zCompileSuccessResponse = zSuccessResponse.extend({ artifact_id: z.string() })
export const zCompileResponse = z.union([zCompileSuccessResponse, zErrorResponse])
export const userHeader = { ["x-user-id"]: z.string() }
```

### 2. Create an register a router

```ts
import * as io from './io' // your zod schemas
import express from 'express'
import swaggerExpress from 'swagger-ui-express'
import * as xo from '@bpinternal/expresso'

const expressApp = express()
const router = new xo.JsonRouter({ info: { title: 'My XO Server', version: '0.1.0' }, bodySize: options.bodySize })

// This route is documented, validated and fully typed
router.post(
  {
    path: '/compile',
    input: io.zCompileBody,
    output: io.zCompileResponse,
    headers: io.userHeader,
    operationId: 'compileBook'
  },
  async (req, res, next) => {
    try {
      const { ['x-user-id']: x_user_id } = req.headers
      const { book } = req.body
      const artifactId = await app.compile(x_user_id, book)
      res.send({ status: 'success', artifact_id: artifactId })
      return next()
    } catch (thrown) {
      return next(thrown)
    }
  }
)

// This route is not documented but is still active. It shows the openapi spec content.
router.inner.get('/openapi.json', async (req, res, next) => {
  try {
    const { openapi } = router
    const specs = openapi.getSpec()
    res.send(specs)
    return next()
  } catch (thrown) {
    return next(thrown)
  }
})

// These will display the Swagger UI to interract with your backend
const { openapi } = router
router.inner.use('/', swaggerExpress.serve)
router.inner.get('/', swaggerExpress.setup(openapi.getSpec()))

expressApp.use('/', router.inner)
```

### 3. Document with Redoc

```ts
const redocHtml = (specUrl: string) => `<!DOCTYPE html>
<html>
  <head>
    <title>Redoc</title>
    <!-- needed for adaptive design -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link
      href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700"
      rel="stylesheet"
    />

    <!--
    Redoc doesn't change outer page styles
    -->
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc
      spec-url="${specUrl}"
    ></redoc>
    <script src="https://unpkg.com/redoc@2.0.0-rc.72/bundles/redoc.standalone.js"></script>
  </body>
</html>
`

router.inner.get('/redoc', async (req, res, next) => {
  try {
    res.send(redocHtml('/openapi.json'))
    return next()
  } catch (thrown) {
    return next(thrown)
  }
})
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.
