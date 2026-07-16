import * as types from '../types'

export class BumpService implements types.BumpService {
  public constructor(private _promptRepo: types.PromptRepository) {}

  public promptJump = async (args: { pkgName: string; currentVersion: string }) => {
    const { pkgName, currentVersion } = args
    const jump = await this._promptRepo.promptChoices({
      message: `Bump ${pkgName} version from ${currentVersion}`,
      choices: [
        { name: 'Patch', value: 'patch' },
        { name: 'Minor', value: 'minor' },
        { name: 'Major', value: 'major' },
        { name: 'None', value: 'none' }
      ]
    })
    return jump
  }
}
