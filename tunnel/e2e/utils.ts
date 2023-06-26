export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
export const expect = <T>(value: T) => ({
  toBe: (expected: T) => {
    if (value !== expected) {
      throw new Error(`Expected ${value} to be ${expected}`)
    }
  },
})
