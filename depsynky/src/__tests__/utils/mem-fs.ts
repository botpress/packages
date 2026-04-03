import picomatch from 'picomatch'
import * as types from '../../types'

export class InMemoryFileSystem implements types.FsRepository {
  public constructor(private _files: Record<string, string>) {}

  public existsSync = (path: string): boolean => {
    return path in this._files
  }

  public readFile = async (path: string): Promise<string> => {
    const file = this._files[path]
    if (!file) {
      throw new Error(`File not found: ${path}`)
    }
    return file
  }

  public writeFile = async (path: string, content: string): Promise<void> => {
    this._files[path] = content
  }

  public globSync = (pattern: string): string[] => {
    const matcher = picomatch(pattern)
    return Object.keys(this._files).filter((f) => matcher(f))
  }
}
