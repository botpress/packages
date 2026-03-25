import prompts from 'prompts'
import * as types from '../types'

export class PromptStdinRepo implements types.PromptRepository {
  public async promptChoices<T extends string>(args: {
    message: string
    choices: { name: string; value: T }[]
  }): Promise<T> {
    const { x } = await prompts({
      type: 'select',
      name: 'x',
      message: args.message,
      choices: args.choices.map((c) => ({ title: c.name, value: c.value }))
    })
    return x
  }
}
