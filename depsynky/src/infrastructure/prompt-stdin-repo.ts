import * as prompts from 'prompts'
import * as types from '../types'

type VersionJump = 'major' | 'minor' | 'patch' | 'none'

export class PromptStdinRepo implements types.PomptRepository {
  async promptJump(pkgName: string, currentVersion: string): Promise<VersionJump> {
    const { jump: promptedJump } = await prompts.prompt({
      type: 'select',
      name: 'jump',
      message: `Bump ${pkgName} version from ${currentVersion}`,
      choices: [
        { title: 'Patch', value: 'patch' },
        { title: 'Minor', value: 'minor' },
        { title: 'Major', value: 'major' },
        { title: 'None', value: 'none' }
      ]
    })
    return promptedJump
  }
}
