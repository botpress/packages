# Readiness

Offers a readiness probe for docker ressources like Postgres, Redis, etc.

## Usage

```sh
npm install @bpinternal/readiness
CONFIG='[{ "type": "http", "name": "google", "url": "https://www.google.com" }]' ready &
curl http://localhost:9398/ready
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.

## Licensing

This software is protected by the same license as the [main Botpress repository](https://github.com/botpress/botpress). You can find the license file [here](https://github.com/botpress/botpress/blob/master/LICENSE).
