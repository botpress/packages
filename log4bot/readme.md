# Log4Bot

This package contains a Logger.

## Usage

```ts
import { Logger } from '@bpinternal/log4bot'

const logger = new Logger('main', { prefix: 'MYAPP', level: 'debug' })
logger.info('I love Botpress.', { afield: '42' })

logger.attachError(new Error('Precondition Failed')).error('An error occured')
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.

## Licensing

This software is protected by the same license as the [main Botpress repository](https://github.com/botpress/botpress). You can find the license file [here](https://github.com/botpress/botpress/blob/master/LICENSE).
