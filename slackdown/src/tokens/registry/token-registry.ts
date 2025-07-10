import { IInlineToken } from '../inline/types'

interface TokenRegistration {
  readonly searchQuery: string
  create(content: string): IInlineToken
}

type AnyTokenClass = new (content: string) => IInlineToken

export class TokenRegistry {
  private static instance: TokenRegistry
  private registrations = new Map<string, TokenRegistration>()

  private constructor() {}

  public static getInstance(): TokenRegistry {
    if (!TokenRegistry.instance) {
      TokenRegistry.instance = new TokenRegistry()
    }
    return TokenRegistry.instance
  }

  public register(tokenClass: AnyTokenClass): void {
    const tokenName = tokenClass.name.replace('Token', '')
    this.registrations.set(tokenName, {
      searchQuery: Reflect.get(tokenClass, 'SEARCH_QUERY'),
      create: (content: string) => new tokenClass(content),
    })
  }

  public getSearchPattern(): string {
    return Array.from(this.registrations.values())
      .map((r) => r.searchQuery)
      .filter(Boolean)
      .join('|')
  }

  public createToken(name: string, content: string): IInlineToken {
    const registration = this.registrations.get(name) ?? this.registrations.get('Text')!

    return registration.create(content)
  }
}
