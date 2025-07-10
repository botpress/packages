import { SlackMarkdownConverter } from './slack-markdown-converter'

export const slackToMarkdown = (src: string): string => {
  const converter = new SlackMarkdownConverter(src)
  return converter.toMarkdown()
}
