import { describe, it, expect } from 'vitest'
import { escapeString } from './utils'


describe('Escape String', () => {
  it('escapes a string containing nothing special', () => {
    expect(escapeString('hello')).toBe("'hello'")
  })

  it('escapes a string containing single quotes', () => {
    expect(escapeString("'hello'")).toMatchInlineSnapshot(`"'\\'hello\\''"`)
  })

  it('escapes a string containing double quotes', () => {
    const world = 'world'
    expect(escapeString(`"Hey ${world}"`)).toMatchInlineSnapshot(`"'"Hey world"'"`)
  })

  it('escapes a string containing double quotes', () => {
    expect(
      escapeString(`
\`\`\`
Hey world
\`\`\`
`),
    ).toMatchInlineSnapshot(`
      ""
      \`\`\`
      Hey world
      \`\`\`
      ""
    `)
  })
})
