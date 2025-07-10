import {
  buildRegExp,
  whitespace,
  oneOrMore,
  anyOf,
  startOfString,
  endOfString,
  repeat,
  choiceOf,
} from 'ts-regex-builder'

export namespace TextCleaner {
  const PATTERNS = {
    TRAILING_SPACES: buildRegExp([oneOrMore(anyOf(' \t')), endOfString], {
      global: true,
      multiline: true,
    }),
    MULTIPLE_NEWLINES: buildRegExp([repeat('\n', { min: 3 })], {
      global: true,
    }),
    SURROUNDING_WHITESPACE: buildRegExp(
      [choiceOf([startOfString, oneOrMore(whitespace)], [oneOrMore(whitespace), endOfString])],
      { global: true },
    ),
    MULTIPLE_SPACES: buildRegExp([oneOrMore(whitespace)], { global: true }),
    LINE_ENDINGS: buildRegExp(['\r\n'], { global: true }),
  } as const

  export const stripDelimiter = (text: string, delimiter: string): string =>
    text.replaceAll(buildRegExp([choiceOf([startOfString, delimiter], [delimiter, endOfString])], { global: true }), '')

  export const normalizeWhitespace = (text: string): string => text.trim().replace(PATTERNS.MULTIPLE_SPACES, ' ')

  export const ensureDoubleNewline = (text: string): string =>
    !text ? text : text.endsWith('\n\n') || text.endsWith('\n') ? text : text + '\n\n'

  export const cleanupMarkdown = (text: string): string =>
    text.replace(PATTERNS.TRAILING_SPACES, '').replace(PATTERNS.MULTIPLE_NEWLINES, '\n\n').trim()
}
