import { ListEntityModel, ListEntitySynonym, wasm, node, ListEntityEngine } from './list-engine'
import { EntityAssert, EntityExpections } from './list-engine.util.test'
import { spaceTokenizer } from './space-tokenizer'
import { EntityParser } from './typings'

export class ListEntityParser implements EntityParser {
  constructor(private _engine: ListEntityEngine, private _listEntities: ListEntityModel[]) {}
  public parse = (text: string) => {
    const tokens = spaceTokenizer(text)
    return this._engine.extractForListModels(tokens, this._listEntities)
  }
}

const T = (syn: string): ListEntitySynonym => ({
  tokens: syn.split(/( )/g)
})

const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
}

const list_entities: ListEntityModel[] = [
  {
    name: 'fruit',
    fuzzy: FuzzyTolerance.Medium,
    values: [
      {
        name: 'Blueberry',
        synonyms: ['blueberries', 'blueberry', 'blue berries', 'blue berry', 'poisonous blueberry'].map(T)
      },
      { name: 'Strawberry', synonyms: ['strawberries', 'strawberry', 'straw berries', 'straw berry'].map(T) },
      { name: 'Raspberry', synonyms: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'].map(T) },
      { name: 'Apple', synonyms: ['apple', 'apples', 'red apple', 'yellow apple'].map(T) }
    ]
  },
  {
    name: 'company',
    fuzzy: FuzzyTolerance.Medium,
    values: [{ name: 'Apple', synonyms: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'].map(T) }]
  },
  {
    name: 'airport',
    fuzzy: FuzzyTolerance.Medium,
    values: [
      { name: 'JFK', synonyms: ['JFK', 'New-York', 'NYC'].map(T) },
      { name: 'SFO', synonyms: ['SFO', 'SF', 'San-Francisco'].map(T) },
      { name: 'YQB', synonyms: ['YQB', 'Quebec', 'Quebec city', 'QUEB'].map(T) }
    ]
  }
]

describe.each(['WASM', 'NODE'])('%s list entity extractor', (engineName: string) => {
  const engine = engineName === 'WASM' ? wasm : node
  const entityParser = new ListEntityParser(engine, list_entities)
  const entityAssert = new EntityAssert(entityParser)

  const entityTest = <T extends string>(utt: T, ...tags: EntityExpections<T>): void => {
    test(utt, () => {
      entityAssert.expect(utt).toBe(...tags)
    })
  }

  test('Data structure test', async () => {
    entityAssert.expect('[Blueberries] are berries that are blue').toBe({
      source: 'Blueberries',
      qty: 'single',
      value: 'Blueberry',
      name: 'fruit',
      confidence: 0.9
    })
  })

  describe('exact match', () => {
    // test: '[Blueberries](qty:1 name:fruit value:Blueberry confidence:0.9) are berries that are blue'
    entityTest('[Blueberries] are berries that are blue', {
      qty: 'single',
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })

    // test: '[Blue berries](qty:1 name:fruit value:Blueberry confidence:0.9) are berries that are blue'
    entityTest('[Blue berries] are berries that are blue', {
      qty: 'single',
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })

    // test: '[blueberry](qty:1 name:fruit value:Blueberry confidence:0.9) are berries that are blue'
    entityTest('[blueberry] are berries that are blue', {
      qty: 'single',
      name: 'fruit',
      value: 'Blueberry',
      confidence: 0.9
    })

    // test: 'blueberry [are berries that are blue](qty:0)') // are berries match rasp berrie
    entityTest('blueberry [are berries that are blue]', { qty: 'none' })

    // test: 'but [strawberries](qty:1 value:Strawberry) are red unlike [blueberries](qty:1 value:Blueberry)'
    entityTest(
      'but [strawberries] are red unlike [blueberries]',
      { qty: 'single', value: 'Strawberry' },
      { qty: 'single', value: 'Blueberry' }
    )

    // test: '[but](qty:0) strawberries [are red unlike](qty:0) blueberries'
    entityTest('[but] strawberries [are red unlike] blueberries', { qty: 'none' }, { qty: 'none' })

    // test: 'an [apple](qty:2 name:fruit confidence:0.90) can be a fruit but also [apple corporation](qty:2 name:company confidence:0.85)'
    entityTest('an [apple] can be a fruit but also [apple corporation]', { qty: 2 }, { qty: 2 })

    // test: 'that is a [poisonous blueberry](qty:1 value:Blueberry confidence:1)'
    entityTest('that is a [poisonous blueberry]', { qty: 'single', value: 'Blueberry', confidence: 1 })

    // test: 'the [red apple](qty:2 name:fruit confidence:0.9) corporation'
    entityTest('the [red apple] corporation', { qty: 'single', name: 'fruit', confidence: 0.9 })

    // test: 'the red [apple corporation](qty:2 name:company)'
    entityTest('the red [apple corporation]', { qty: 2 })

    // test: 'the [red](qty:1) apple [corporation](qty:1)'
    entityTest('the [red] apple [corporation]', { qty: 'single' }, { qty: 'single' })

    // test: '[apple](qty:2)'
    entityTest('[apple]', { qty: 2 })

    // test: '[apple inc](qty:2)'
    entityTest('[apple inc]', { qty: 2 })

    // test: '[SF](qty:1 name:airport) is where I was born, I now live in [Quebec](qty:1 name:airport) [the city](qty:0)'
    entityTest(
      '[SF] is where I was born, I now live in [Quebec] [the city]',
      { qty: 'single', name: 'airport' },
      { qty: 'single', name: 'airport' },
      { qty: 'none' }
    )
  })
})
