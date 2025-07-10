import type { IInlineToken } from './types'

export namespace InlineTokenRenderer {
  interface SpacingContext {
    currentToken: IInlineToken
    prevToken: IInlineToken
    currentRendered: string
    prevRendered: string
  }

  export const renderInlineTokens = (tokens: IInlineToken[]): string => {
    if (tokens.length === 0) return ''

    return tokens.map((token, i, arr) => renderWithSpacing(token, i, arr)).join('')
  }

  const renderWithSpacing = (token: IInlineToken, index: number, allTokens: IInlineToken[]): string => {
    const rendered = token.renderAsMarkdown()
    if (index === 0) return rendered

    const prevToken = allTokens[index - 1]!
    const prevRendered = prevToken.renderAsMarkdown()

    return needsSpacing({
      currentToken: token,
      prevToken,
      currentRendered: rendered,
      prevRendered,
    })
      ? ` ${rendered}`
      : rendered
  }

  const needsSpacing = (context: SpacingContext): boolean => {
    const currentTokenName = context.currentToken.constructor.name
    const prevTokenName = context.prevToken.constructor.name
    return (
      (currentTokenName === 'BaseFormattedToken' || prevTokenName === 'BaseFormattedToken') &&
      !context.prevRendered.endsWith(' ') &&
      !context.currentRendered.startsWith(' ')
    )
  }
}
