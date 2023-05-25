export default {
  id: 'rassemblements',
  name: 'Rassemblements',
  type: 'list',
  occurrences: [
    {
      name: 'Événements',
      synonyms: []
    },
    {
      name: 'Marriage',
      synonyms: ['wedding']
    },
    {
      name: 'Funérailles',
      synonyms: ['funeral']
    },
    {
      name: 'party',
      synonyms: ['fête', "soirée d'amis", 'festival']
    },
    {
      name: 'Souper de famille',
      synonyms: ['souper avec parents', 'souper avec fils', 'souper avec filles', 'souper avec enfants']
    },
    {
      name: "Souper d'amis",
      synonyms: ['souper entre amis']
    },
    {
      name: 'Messe',
      synonyms: []
    },
    {
      name: 'Batême',
      synonyms: []
    }
  ],
  fuzzy: 0.8,
  examples: [],
  pattern: ''
} as const
