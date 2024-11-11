# GenEnv

Small CLI to generate typescript file exporting constants from environment variables.

## Usage

Program:

```bash
export MY_ENV1=foo
export MY_ENV2=bar
npx genenv gen -o ./.secrets/index.ts -e MY_ENV1 -e MY_ENV2 -e MY_ENV3
cat ./.secrets/index.ts
```

Output:

```typescript
export const MY_ENV1 = 'foo'
export const MY_ENV2 = 'bar'
export const MY_ENV3 = '$MY_ENV3' // default value
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
