import { lists } from '../..'

console.log('Starting browser test...')
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

async function main() {
  const extracted = await ex.extract('I like apples and oranges')
  console.log(JSON.stringify(extracted, null, 2))

  if (extracted.length !== 1) {
    throw new Error('Expected 1 extracted entity')
  }
}

main().then(() => {
  console.log('done')
})
