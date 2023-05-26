import { ListEntityModel, ListEntitySynonym } from '../list-engine'

const FuzzyTolerance = {
  Loose: 0.65,
  Medium: 0.8,
  Strict: 1
} as const

const T = (syn: string): ListEntitySynonym => ({
  tokens: syn.split(/ /g)
})

export const listEntities = [
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
  },
  {
    name: 'state',
    fuzzy: FuzzyTolerance.Medium,
    values: [{ name: 'NewYork', synonyms: ['New York'].map(T) }]
  },
  {
    name: 'city',
    fuzzy: FuzzyTolerance.Medium,
    values: [{ name: 'NewYork', synonyms: ['New York'].map(T) }]
  }
] satisfies ListEntityModel[]

export const utterances = [
  'Blueberries are berries that are blue',
  'I want to go to New-York',
  'I want to eat an apple',
  'I want to eat an Apple in the big Apple'
] satisfies string[]
