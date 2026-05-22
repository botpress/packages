import * as types from '../types'
import * as fs from 'fs'
import * as glob from 'glob'

export class FsRepo implements types.FsRepository {
  public existsSync(path: string): boolean {
    return fs.existsSync(path)
  }

  public readFile(path: string): Promise<string> {
    return fs.promises.readFile(path, 'utf-8')
  }

  public writeFile(path: string, content: string): Promise<void> {
    return fs.promises.writeFile(path, content, 'utf-8')
  }

  public globSync(pattern: string, opts?: Partial<types.GlobOptions>): string[] {
    return glob.sync(pattern, opts)
  }
}
