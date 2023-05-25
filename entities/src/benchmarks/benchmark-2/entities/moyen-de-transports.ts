export default {
  id: 'moyen-de-transports',
  name: 'Moyen de transports',
  type: 'list',
  occurrences: [
    {
      name: 'Métro',
      synonyms: ['metro']
    },
    {
      name: 'Autobus',
      synonyms: ['bus', 'metrobus']
    },
    {
      name: 'Avion',
      synonyms: ['airplane', 'plane']
    },
    {
      name: 'Vélo',
      synonyms: ['bike', 'bicycle']
    }
  ],
  fuzzy: 0.8,
  examples: [],
  pattern: ''
} as const
