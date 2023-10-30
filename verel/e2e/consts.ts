export const validProgram = `
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

export const invalidProgram = `
del()
`

export const inputEvent = {
  message: 'Hello VRL',
  foo: 'delete me',
  http_status: '200'
}

export const outputEvent = {
  message: 'Hello VRL',
  status: 'success'
}

export const successMessage = '__SUCCESS__'
export const failureMessage = '__FAIL__'
