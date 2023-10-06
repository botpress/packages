import { lists } from '../..'

const entities: lists.ListEntityDef[] = [
  {
    name: 'fruit',
    fuzzy: 'medium',
    values: [
      {
        name: 'apple',
        synonyms: ['apple', 'apples', 'red apple', 'red apples', 'aple']
      }
    ]
  }
]

console.log('entities', JSON.stringify(entities, null, 2))

const ex = new lists.ListEntityExtractor(entities, { engine: 'wasm' })

const extracted = ex.extract('I like apples and oranges')

console.log(JSON.stringify(extracted, null, 2))

if (extracted.length !== 1) {
  throw new Error('Expected 1 extracted entity')
}
