import * as fs from 'fs'
import * as prettier from 'prettier'
import * as objects from '../utils/objects'
import * as types from '../types'

export class PackageJsonFsRepo implements types.PackageJsonRepository {
  public read = async (filePath: string): Promise<types.PackageJson> => {
    const strContent = await fs.promises.readFile(filePath, 'utf-8')
    const content = JSON.parse(strContent)
    return content
  }

  public write = async (filePath: string, content: types.PackageJson): Promise<void> => {
    let strContent = JSON.stringify(content, null, 2)
    strContent = prettier.format(strContent, { parser: 'json' })
    await fs.promises.writeFile(filePath, strContent)
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
