import etablissements from './etablissements'
import medicaments from './medicaments'
import moyen from './moyen-de-transports'
import pays from './pays'
import rassemblements from './rassemblements'
import regions from './regions-touristiques'
import symptomes from './symptomes'

export type Entity =
  | typeof etablissements
  | typeof medicaments
  | typeof moyen
  | typeof pays
  | typeof rassemblements
  | typeof regions
  | typeof symptomes

export type Occurrence = Entity['occurrences'][number]

export const entities: Entity[] = [etablissements, medicaments, moyen, pays, rassemblements, regions, symptomes]
