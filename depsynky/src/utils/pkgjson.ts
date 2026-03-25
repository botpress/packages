import * as fs from 'fs'
import * as prettier from 'prettier'
import * as objects from './objects'

export type PackageJson = {
  name: string
  version: string
  private?: boolean
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export const read = async (filePath: string): Promise<PackageJson> => {
  const strContent = await fs.promises.readFile(filePath, 'utf-8')
  const content = JSON.parse(strContent)
  return content
}

export const write = async (filePath: string, content: PackageJson): Promise<void> => {
  let strContent = JSON.stringify(content, null, 2)
  strContent = prettier.format(strContent, { parser: 'json' })
  await fs.promises.writeFile(filePath, strContent)
}

export const update = async (filePath: string, content: Partial<PackageJson>) => {
  const currentPackage = await read(filePath)

  // this preserves the order of the keys
  const newPackage = objects.keys(currentPackage).reduce((acc, key) => {
    if (key in content) {
      return { ...acc, [key]: content[key] }
    }
    return acc
  }, currentPackage)

  await write(filePath, newPackage)
}
