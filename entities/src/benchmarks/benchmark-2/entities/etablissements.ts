export default {
  id: 'etablissements',
  name: 'Etablissements',
  type: 'list',
  occurrences: [
    {
      name: 'SAQ',
      synonyms: ['société des alcools', 'wine store', 'wine shop']
    },
    {
      name: 'Épicerie',
      synonyms: ['provigo', 'maxi', 'iga']
    },
    {
      name: 'Dépanneur',
      synonyms: ['convenience store', '711', 'couche-tard']
    },
    {
      name: 'Pharmacie',
      synonyms: ['pharmacy', 'brunet', 'phamiliprix', 'pharmaprix']
    }
  ],
  fuzzy: 0.8,
  examples: [],
  pattern: ''
} as const
