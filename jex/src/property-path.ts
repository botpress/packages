export type PropertyPathSection =
  | {
      type: 'string-index'
      value?: string
    }
  | {
      type: 'number-index'
      value?: number
    }
  | {
      type: 'key'
      value: string
    }

export type PropertyPath = PropertyPathSection[]

/**
 *
 * @param path A data structure that represents a path to a property in a JSON object
 * @returns A string representation of the path for easier debugging. This string is used when returning an extension failure reason.
 */
export const pathToString = (path: PropertyPath): string =>
  '#' +
  path
    .map((section) => {
      if (section.type === 'string-index') {
        const value = section.value === undefined ? 'string' : `"${section.value}"`
        return `[${value}]`
      }
      if (section.type === 'number-index') {
        const value = section.value === undefined ? 'number' : section.value
        return `[${value}]`
      }
      return `.${section.value}`
    })
    .join('')
