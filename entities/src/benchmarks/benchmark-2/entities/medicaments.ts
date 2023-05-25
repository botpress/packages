export default {
  id: 'medicaments',
  name: 'Medicaments',
  type: 'list',
  occurrences: [
    {
      name: 'Tylenol',
      synonyms: ['Acétaminophène']
    },
    {
      name: 'Advil',
      synonyms: ['Ibuprofène']
    },
    {
      name: 'anti-douleur',
      synonyms: []
    },
    {
      name: 'Pillules',
      synonyms: []
    }
  ],
  fuzzy: 0.8,
  examples: [],
  pattern: ''
} as const
