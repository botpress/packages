import _ from 'lodash'

export type Token = {
  value: string

  isWord: boolean
  isSpace: boolean

  startChar: number
  endChar: number
  startToken: number
  endToken: number
}

const SPECIAL_CHARSET = '¿÷≥≤µ˜∫√≈æ…¬˚˙©+-_!@#$%?&*()/\\[]{}:;<>=.,~`"\''.split('').map((c) => `\\${c}`)
const isWord = (str: string) => _.every(SPECIAL_CHARSET, (c) => !RegExp(c).test(str)) && !hasSpace(str)
const hasSpace = (str: string) => _.some(str, isSpace)
const isSpace = (str: string) => _.every(str, (c) => c === ' ')

export const toTokens = (strTokens: string[]): Token[] => {
  const tokens: Token[] = []

  let charIndex = 0

  for (let i = 0; i < strTokens.length; i++) {
    const strToken = strTokens[i]

    const token: Token = {
      value: strToken,

      isWord: isWord(strToken),
      isSpace: isSpace(strToken),

      startChar: charIndex,
      endChar: charIndex + strToken.length,
      startToken: i,
      endToken: i + 1
    }

    tokens.push(token)

    charIndex += strToken.length
  }

  return tokens
}

export const takeUntil = (arr: Token[], start: number, desiredLength: number): Token[] => {
  let total = 0
  const result = _.takeWhile(arr.slice(start), (t) => {
    const toAdd = t.value.length
    const current = total
    if (current > 0 && Math.abs(desiredLength - current) < Math.abs(desiredLength - current - toAdd)) {
      // better off as-is
      return false
    } else {
      // we're closed to desired if we add a new token
      total += toAdd
      return current < desiredLength
    }
  })
  if (result[result.length - 1].isSpace) {
    result.pop()
  }
  return result
}
