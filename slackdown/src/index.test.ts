import { describe, test, expect } from 'vitest'
import { slackToMarkdown } from './index'

describe.concurrent('SlackMarkdownConverter', () => {
  describe.concurrent('basic text handling', () => {
    test.concurrent.each([
      ['simple text', 'Hello', 'Hello'],
      ['multiple lines', 'Hello\nWorld', 'Hello\n\nWorld'], // Double newline for paragraphs
      ['with spaces', '  Hello  ', 'Hello'], // Excess spaces removed
      ['empty string', '', ''],
    ])('handles %s correctly', (_, input, expected) => {
      expect(slackToMarkdown(input)).toBe(expected)
    })
  })

  describe.concurrent('inline formatting', () => {
    describe.concurrent('single format', () => {
      test.concurrent.each([
        ['bold', '*bold*', '**bold**'],
        ['italic', '_italic_', '*italic*'],
        ['code', '`code`', '`code`'],
        ['strikethrough', '~strike~', '~~strike~~'],
      ])('converts %s correctly', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('nested formats', () => {
      test.concurrent.each([
        ['bold and italic', '*_both_*', '***both***'],
        ['bold and lonely italic', '*bold _italic_*', '**bold *italic***'],
        ['italic and bold', '_*both*_', '***both***'],
        ['italic and lonely bold', '_italic *bold*_', '*italic **bold***'],
        ['bold italic bold', '*bold _italic_ bold*', '**bold *italic* bold**'],
        ['bold and code', '*`code`*', '**`code`**'],
        ['italic and strike', '_~strike~_', '*~~strike~~*'],
        ['all formats', '*_`~all~`_*', '***`~~all~~`***'],
      ])('handles %s correctly', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })
  })

  describe.concurrent('links', () => {
    test.concurrent.each([
      ['simple link', '<https://example.com>', '[https://example.com](https://example.com)'],
      ['labeled link', '<https://example.com|Click Here>', '[Click Here](https://example.com)'],
      ['invalid link', '<not-a-url>', '<not-a-url>'],
      ['invalid link with label', '<not-a-url|Click Here>', '<not-a-url|Click Here>'],
    ])('processes %s correctly', (_, input, expected) => {
      expect(slackToMarkdown(input)).toBe(expected)
    })
  })

  describe.concurrent('lists', () => {
    test.concurrent.each([
      {
        type: 'bulleted list',
        input: '- Item 1\n- Item 2\n- Item 3',
        expected: '* Item 1\n* Item 2\n* Item 3',
      },
      {
        type: 'ordered list',
        input: '1. First\n2. Second\n3. Third',
        expected: '1. First\n2. Second\n3. Third',
      },
      {
        type: 'mixed list with formatting',
        input: '- *Bold item*\n- _Italic item_\n- `Code item`',
        expected: '* **Bold item**\n* *Italic item*\n* `Code item`',
      },
    ])('converts $type correctly', ({ input, expected }) => {
      expect(slackToMarkdown(input)).toBe(expected)
    })
  })

  describe.concurrent('block elements', () => {
    describe.concurrent('code blocks', () => {
      test.concurrent.each([
        {
          description: 'basic code block',
          input: '```code block\nwith multiple lines```',
          expected: '```text\ncode block\nwith multiple lines\n```',
        },
        {
          description: 'with indentation',
          input: '```  indented\n    more```',
          expected: '```text\n  indented\n    more\n```',
        },
      ])('handles $description', ({ input, expected }) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('blockquotes', () => {
      test.concurrent.each([
        {
          description: 'single line',
          input: '> quoted text',
          expected: '> quoted text',
        },
        {
          description: 'multiple lines',
          input: '> line one\n> line two',
          expected: '> line one\n> line two',
        },
        {
          description: 'with formatting',
          input: '> *bold* and _italic_',
          expected: '> **bold** and *italic*',
        },
      ])('handles $description', ({ input, expected }) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })
  })

  describe.concurrent('complex documents', () => {
    test.concurrent.each([
      {
        name: 'mixed content document',
        input: [
          '# Complex Example',
          '',
          '- *Bold list item*',
          '- Item with _italic_',
          '',
          '> Quote with `code`',
          '',
          '```Code block',
          '    Multiple lines```',
          '',
          'Normal paragraph with <https://example.com|link>',
        ].join('\n'),
        expected: [
          '\\# Complex Example',
          '',
          '* **Bold list item**',
          '* Item with *italic*',
          '',
          '> Quote with `code`',
          '',
          '```text',
          'Code block',
          '    Multiple lines',
          '```',
          '',
          'Normal paragraph with [link](https://example.com)',
        ].join('\n'),
      },
      {
        name: 'mixed blocks with nested formatting',
        input: ['> Quote with *bold*', '> And `code`', '', '```*bold* and _italic_```', '', '- List with *bold*'].join(
          '\n',
        ),
        expected: [
          '> Quote with **bold**',
          '> And `code`',
          '',
          '```text',
          '*bold* and _italic_',
          '```',
          '',
          '* List with **bold**',
        ].join('\n'),
      },
      {
        name: 'links with formatting',
        input: [
          '*<https://example.com|Bold Link>*',
          '_<https://example.com|Italic Link>_',
          '`<https://example.com|Code Link>`',
          '- List with <https://example.com|Link>',
          '> Quote with <https://example.com|Link>',
        ].join('\n'),
        expected: [
          '**[Bold Link](https://example.com)**',
          '',
          '*[Italic Link](https://example.com)*',
          '',
          '`[Code Link](https://example.com)`',
          '',
          '* List with [Link](https://example.com)',
          '',
          '> Quote with [Link](https://example.com)',
        ].join('\n'),
      },
    ])('processes $name correctly', ({ input, expected }) => {
      expect(slackToMarkdown(input)).toBe(expected)
    })
  })

  describe.concurrent('edge cases', () => {
    describe.concurrent('unclosed elements', () => {
      test.concurrent.each([
        ['code block', '```no closing', '```no closing'],
        ['bold', '*unclosed', '*unclosed'],
        ['italic', '_unclosed', '_unclosed'],
      ])('handles unclosed %s', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('whitespace handling', () => {
      test.concurrent.each([
        ['trailing spaces', 'text  ', 'text'],
        ['multiple newlines', '\n\n\ntext', 'text'], // Remove excess newlines
        ['trailing newlines', 'text\n\n', 'text'],
      ])('handles %s correctly', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('empty blocks', () => {
      test.concurrent.each([
        ['empty code block', '```\n```', '```text\n\n```'],
        ['empty blockquote', '>', '>'],
        ['empty list item', '-', '-'],
      ])('handles %s', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('deeply nested formatting', () => {
      test.concurrent.each([
        ['mixed triple nesting', '*bold _italic `code` italic_ bold*', '**bold *italic `code` italic* bold**'],
        [
          'all formats nested',
          '*bold _italic `code ~strike~` italic_ bold*',
          '**bold *italic `code ~~strike~~` italic* bold**',
        ],
      ])('handles %s', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })

    describe.concurrent('malformed input', () => {
      test.concurrent.each([
        ['mismatched bold', '*bold**', '**bold***'],
        ['mismatched italic', '_italic__', '*italic*_'],
        ['incomplete link', '<https://example', '<https://example'],
        ['empty link', '<>', '<>'],
        ['incomplete code block', '```code\nmore', '```code\nmore'],
      ])('handles %s', (_, input, expected) => {
        expect(slackToMarkdown(input)).toBe(expected)
      })
    })
  })
})
