export default {
  id: 'symptomes',
  name: 'Symptomes',
  type: 'list',
  occurrences: [
    {
      name: 'cough',
      synonyms: ['je tousse', 'toux', 'toux sèche']
    },
    {
      name: 'fever',
      synonyms: ["j'ai froid", "j'ai chaud", 'fièvre', 'température']
    },
    {
      name: 'headache',
      synonyms: ['mal de tête', 'mal à tête', 'maux de tête']
    },
    {
      name: 'upset stomach',
      synonyms: ["brûlement d'estomac", 'mal au ventre']
    },
    {
      name: 'sore throat',
      synonyms: ['mal à la gorge', 'maux de gorge']
    },
    {
      name: 'sneezing',
      synonyms: ['je mouche', "j'éternue", 'éternuements']
    },
    {
      name: 'congestion',
      synonyms: []
    },
    {
      name: 'dizziness',
      synonyms: ['étourdis', 'étourdissement']
    },
    {
      name: 'vomiting',
      synonyms: ['vomissement', 'régurgitement']
    }
  ],
  fuzzy: 0.8,
  examples: [],
  pattern: ''
} as const
