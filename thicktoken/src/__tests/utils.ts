import * as fs from 'fs'
import * as path from 'path'

export function generateSentence(wordCount: number): string {
  const filePath = path.resolve(__dirname, 'random-words.txt')
  const words = fs.readFileSync(filePath, 'utf-8').split('\n').filter(Boolean)
  const selectedWords: string[] = []
  while (selectedWords.length < wordCount) {
    const randomIndex = Math.floor(Math.random() * words.length)
    selectedWords.push(words[randomIndex])
  }

  return selectedWords.join('')
}
