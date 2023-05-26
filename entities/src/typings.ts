export type EntityType = 'list' | 'pattern'

export type Entity = {
  type: EntityType
  name: string
  confidence: number
  value: string
  source: string
  char_start: number
  char_end: number
}

export type EntityParser = {
  parse: (text: string) => Entity[]
}
