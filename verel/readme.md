# VeReL

VeReL exposes the Rust library [VRL](https://github.com/vectordotdev/vrl) to JavaScript with WebAssembly.

## Installation

```bash
npm install @bpinternal/verel # for npm
yarn add @bpinternal/verel # for yarn
pnpm add @bpinternal/verel # for pnpm
```

## Usage

```ts
import * as vrl from '@bpinternal/verel'

const program = `
# Remove some fields
del(.foo)

# Add a timestamp
.timestamp = now()

# Parse HTTP status code into local variable
http_status_code = parse_int!(.http_status)
del(.http_status)

# Add status
if http_status_code >= 200 && http_status_code <= 299 {
    .status = "success"
} else {
    .status = "error"
}
`

const inputEvent = {
  message: 'Hello VRL',
  foo: 'delete me',
  http_status: '200'
}

const { errors } = vrl.check(program)
if (errors.length) {
  console.error(vrl.formatDiagnostic(errors[0]))
  process.exit(1)
}

const { event: outputEvent } = vrl.execute(program, inputEvent)
console.log(outputEvent)
```
