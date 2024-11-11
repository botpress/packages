# Promex

> Prometheus client initialization package for express

## Usage

Promex is a utility to initialize the Promster library. Install the package and see the example below

```ts
import * as promex from '@bpinternal/promex';
import express from 'express';

const backend = express();
const admin = express();

[...]

promex.init(backend); // Adds a recording middleware on the express app
promex.init(admin); // Adds a recording middleware on the express app

[...]

promex.start() // Starts a metrics server on port 9090

```

Promex can also be used with an handler on an express app

```ts
import * as promex from '@bpinternal/promex';
import express from 'express';

const app = express()

app.get('/metrics', promex.handler()) // Adds a '/metrics' endpoint that returns the Prometheus metrics

promex.init(app) // Adds a recording middleware on the express app

[...]

app.listen()
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
