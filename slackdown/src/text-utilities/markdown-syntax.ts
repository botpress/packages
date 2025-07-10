export namespace MarkdownSyntax {
  // Input (Slack) delimiters
  export const SLACK = {
    BOLD: '*',
    ITALIC: '_',
    CODE: '`',
    STRIKETHROUGH: '~',
    LINK_START: '<',
    LINK_END: '>',
    LINK_SEPARATOR: '|',
  } as const

  // Output (Markdown) syntax
  export const MARKDOWN = {
    BOLD: '**',
    ITALIC: '*',
    CODE: '`',
    STRIKETHROUGH: '~~',
    LINK_FORMAT: '[%s](%s)',
    BULLET: '*',
    BLOCK_QUOTE_PREFIX: '> ',
    CODE_BLOCK_FENCE: '```',
    CODE_BLOCK_LANG: 'text',
  } as const
}
