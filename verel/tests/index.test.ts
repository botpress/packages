import { expect, test } from 'vitest'
import { check, execute } from '..'

test('check valid program', () => {
  const validProgram = `
# Remove some fields
del(.foo)

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
  const validProgramCheckResult = check(validProgram)
  expect(validProgramCheckResult.errors).toHaveLength(0)
  expect(validProgramCheckResult.warnings).toHaveLength(0)
})

test('check invalid program', () => {
  const invalidProgram = 'del()'
  const invalidProgramCheckResult = check(invalidProgram)
  expect(invalidProgramCheckResult.errors).toHaveLength(1)
  expect(invalidProgramCheckResult.warnings).toHaveLength(0)
})

test('execute valid program', () => {
  const program = `
# Remove some fields
del(.foo)

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
  const inputEvent = { message: 'Hello VRL', foo: 'delete me', http_status: '200' }
  const result = execute(program, inputEvent)
  expect(result.event).toEqual({ message: 'Hello VRL', status: 'success' })
})

test('execute camelCase function', () => {
  const inputEvent = { key: 'hello-vrl' }
  const result = execute('camelcase!(.key)', inputEvent)
  expect(result.result).toEqual('helloVrl')
})
