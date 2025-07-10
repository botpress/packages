import { MarkdownSyntax } from './markdown-syntax'
import {
  buildRegExp,
  startOfString,
  capture,
  optional,
  oneOrMore,
  any,
  negativeLookahead,
  negativeLookbehind,
  whitespace,
  digit,
  anyOf,
  zeroOrMore,
  negated,
  choiceOf,
  endOfString,
} from 'ts-regex-builder'

const { SLACK } = MarkdownSyntax

export namespace RegexPatterns {
  // Common patterns
  const noWhitespaceStart = negativeLookahead(whitespace)
  const noWhitespaceEnd = negativeLookbehind(whitespace)
  const lineEnd = choiceOf('\n', endOfString)
  const lineStart = startOfString

  // Non-newline content patterns
  const nonNewline = negated(anyOf('\n'))
  const nonNewlineContent = capture(zeroOrMore(nonNewline))

  // Indentation patterns
  const indentChars = anyOf(' \t')
  const nonNewlinePlus = oneOrMore(nonNewline)
  const nonNewlineWithIndent = capture([zeroOrMore(indentChars), nonNewlinePlus])

  const whitespaceCapture = capture(oneOrMore(whitespace))

  // Inline formatting patterns
  export const BOLD = buildRegExp([
    capture([SLACK.BOLD, noWhitespaceStart, capture(zeroOrMore(any, { greedy: false })), noWhitespaceEnd, SLACK.BOLD], {
      name: 'Bold',
    }),
  ]).source

  export const ITALIC = buildRegExp([
    capture([SLACK.ITALIC, capture(zeroOrMore(any, { greedy: false })), SLACK.ITALIC], {
      name: 'Italic',
    }),
  ]).source

  export const CODE = buildRegExp([
    capture([SLACK.CODE, capture(zeroOrMore(any, { greedy: false })), SLACK.CODE], {
      name: 'Code',
    }),
  ]).source

  export const STRIKETHROUGH = buildRegExp([
    capture([SLACK.STRIKETHROUGH, capture(zeroOrMore(any, { greedy: false })), SLACK.STRIKETHROUGH], {
      name: 'Strikethrough',
    }),
  ]).source

  export const LINK = buildRegExp([
    capture([SLACK.LINK_START, capture(zeroOrMore(any, { greedy: false })), SLACK.LINK_END], {
      name: 'Link',
    }),
  ]).source

  // Block level patterns
  export const ORDERED_LIST = buildRegExp([
    lineStart,
    oneOrMore(digit),
    '.',
    oneOrMore(whitespace),
    nonNewlineContent,
    lineEnd,
  ]).source

  export const BULLETED_LIST = buildRegExp([lineStart, '-', oneOrMore(whitespace), nonNewlineContent, lineEnd]).source

  export const BLOCK_QUOTE = buildRegExp([lineStart, '>', optional(whitespace), nonNewlineContent, lineEnd]).source

  export const CODE_BLOCK = buildRegExp([
    lineStart,
    '```',
    capture(zeroOrMore([negativeLookahead('```'), any], { greedy: false })),
    '```',
    lineEnd,
  ]).source

  export const PARAGRAPH = buildRegExp([lineStart, nonNewlineWithIndent, lineEnd]).source

  export const SPACE = buildRegExp([lineStart, whitespaceCapture]).source

  export const HEADER = buildRegExp([lineStart, oneOrMore('#'), whitespace]).source
}
