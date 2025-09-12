// validate the string is alphanumeric and starts with a letter
export function isAlphanumeric(str: string): boolean {
  return /^[a-z][a-z0-9]*$/i.test(str)
}

// validate the string is alphabetical and starts with a capital letter
export function isCapitalAlphabetical(str: string): boolean {
  return /^[A-Z][a-zA-Z]+$/i.test(str)
}

export function formatResponseName(operationName: string) {
  return `${operationName}Response`
}

export function formatBodyName(operationName: string) {
  return `${operationName}Body`
}

export function removeFromArray(array: string[], item: string) {
  const index = array.indexOf(item)
  if (index > -1) {
    array.splice(index, 1)
  }
}
