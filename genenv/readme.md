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
