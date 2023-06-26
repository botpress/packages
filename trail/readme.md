# Trail

> Opentelemetry initialization package for nodejs

## Usage

Trail is a utility to initialize the Opentelemetry library. First, you must install the instrumentation packages of the library you want to instrument.

For example, you could install the package `@opentelemetry/instrumentation-express` to instrument `express`. Then, your TypeScript program could look like this:

```ts
import { init } from '@bpinternal/trail'
init()

import express from 'express'
```

The available environment variables for configuring the tracing client are:

- TRACING_ENABLED `bool` Enables the tracer
- TRACING_DEBUG `bool` Adds debug information about the tracing configuration
- OTEL_EXPORTER_JAEGER_ENDPOINT `url` Sets the Jaeger collector endpoint
- OTEL_SERVICE_NAME `string` Sets the service name given to a trace
- OTEL_SERVICE_VERSION `string` Sets the current running version of the service
- OTEL_SERVICE_VERSION_INSTANCE_ID `string` Sets the node intance id on which the service is running on
- OTEL_SERVICE_NAMESPACE `string` Sets the namespace of the service
- OTEL_DEPLOYMENT_ENVIRONMENT `string` Sets the environment of the service

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.
