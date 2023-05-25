import { ListEntityModel, ListEntitySynonym } from '../../list-engine'
import { entities, Occurrence } from './entities'
import { intents } from './intents'

const T = (syn: string): ListEntitySynonym => ({
  tokens: syn.split(/ /g)
})

export const listEntities = entities.map(
  (e) =>
    ({
      name: e.name,
      fuzzy: e.fuzzy,
      values: e.occurrences.map((o: Occurrence) => ({
        name: o.name,
        synonyms: o.synonyms.map(T)
      }))
    } satisfies ListEntityModel)
)

export const utterances: string[] = intents.flatMap((i) => i.utterances.fr)
