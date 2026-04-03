import * as prettier from 'prettier'
import * as objects from '../utils/objects'
import * as types from '../types'

export class PackageJsonService implements types.PackageJsonService {
  public constructor(private _fs: types.FsRepository) {}

  public read = async (filePath: string): Promise<types.PackageJson> => {
    const strContent = await this._fs.readFile(filePath)
    const content = JSON.parse(strContent)
    return content
  }

  public write = async (filePath: string, content: types.PackageJson): Promise<void> => {
    let strContent = JSON.stringify(content, null, 2)
    strContent = prettier.format(strContent, { parser: 'json' })
    await this._fs.writeFile(filePath, strContent)
  }

  public update = async (filePath: string, content: Partial<types.PackageJson>) => {
    const currentPackage = await this.read(filePath)

    // this preserves the order of the keys
    const newPackage = objects.keys(currentPackage).reduce((acc, key) => {
      if (key in content) {
        return { ...acc, [key]: content[key] }
      }
      return acc
    }, currentPackage)

    await this.write(filePath, newPackage)
  }
}
