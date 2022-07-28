# Trail
> Opentelemetry initialization package for nodejs

## Usage

Trail is a utility to initialize the Opentelemetry library. First, you must install the instrumentation packages of the library you want to instrument.

For example, you could install the package `@opentelemetry/instrumentation-express` to instrument `express`. Then, your TypeScript program could look like this:

```ts
import { init } from '@bpinternal/trail';
init();

import express from 'express';
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.

## Licensing

This software is protected by the same license as the [main Botpress repository](https://github.com/botpress/botpress). You can find the license file [here](https://github.com/botpress/botpress/blob/master/LICENSE).
