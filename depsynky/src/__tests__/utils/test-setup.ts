import * as types from '../../types'
import { InMemoryFileSystem } from './mem-fs'
import { PackageJsonService } from '../../application/pkgjson-service'
import { PNPM_WORKSPACE_FILE, PnpmWorkspaceService } from '../../application/pnpm-service'
import { DepSynkyApplication } from '../../application/application'

export type Monorepo<Name extends string> = {
  packages: (types.PackageJson & { name: Name })[]
}

export type PkgReader<Name extends string> = {
  read: (pkgName: Name) => Promise<types.PackageJson>
}

const ROOT_DIR = '/repo'

const kebabCase = (str: string) => {
  const tokens = str.match(/[A-Za-z0-9]+/g)
  if (!tokens) {
    return str
  }
  return tokens.map((t) => t.toLowerCase()).join('-')
}

const _buildFs = (monorepo: Monorepo<string>): InMemoryFileSystem => {
  const files: Record<string, string> = {}

  const workspacePatterns = ['packages/*']
  files[`${ROOT_DIR}/${PNPM_WORKSPACE_FILE}`] = [
    //
    'packages:',
    ...workspacePatterns.map((p) => `  - "${p}"`),
    ''
  ].join('\n')

  for (const pkg of monorepo.packages) {
    const dirName = kebabCase(pkg.name)
    files[`packages/${dirName}`] = ''
    const pkgJsonPath = `${ROOT_DIR}/packages/${dirName}/package.json`
    files[pkgJsonPath] = JSON.stringify(pkg)
  }

  return new InMemoryFileSystem(files)
}

export const buildApp = <Name extends string>(
  monorepo: Monorepo<Name>,
  bumpFn: types.BumpService['promptJump'] = async () => 'none'
) => {
  const fs = _buildFs(monorepo)
  const pkg = new PackageJsonService(fs)
  const pnpm = new PnpmWorkspaceService(pkg, fs, ROOT_DIR)
  const bump: types.BumpService = { promptJump: bumpFn }
  const app = new DepSynkyApplication(pnpm, pkg, bump)
  return {
    app,
    pkg: {
      read: async (pkgName: Name) => {
        const dirName = kebabCase(pkgName)
        const pkgJsonPath = `${ROOT_DIR}/packages/${dirName}/package.json`
        return pkg.read(pkgJsonPath)
      }
    }
  }
}
