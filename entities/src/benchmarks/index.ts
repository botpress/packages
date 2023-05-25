import { ListEntityModel } from '../list-engine'

import * as bench1 from './benchmark-1'
import * as bench2 from './benchmark-2'

export type BenchMark = {
  name: string
  entities: ListEntityModel[]
  utterances: string[]
}

export const benchmark1: BenchMark = {
  name: 'benchmark-1',
  entities: bench1.listEntities,
  utterances: bench1.utterances
}

export const benchmark2: BenchMark = {
  name: 'covid-bot',
  entities: bench2.listEntities,
  utterances: bench2.utterances
}
