import * as fs from 'fs'
import * as glob from 'glob'
import * as pathlib from 'path'
import * as yaml from 'yaml'
import * as errors from '../errors'
import * as objects from './objects'
import * as pkgjson from './pkgjson'
import * as sets from './sets'

const abs = (rootDir: string) => (p: string) => pathlib.resolve(rootDir, p)

export type PnpmWorkspace = {
  path: string
  content: pkgjson.PackageJson
}

const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml'

export const searchWorkspaces = (rootDir: string): PnpmWorkspace[] => {
  const pnpmWorkspacesFile = pathlib.join(rootDir, PNPM_WORKSPACE_FILE)
  if (!fs.existsSync(pnpmWorkspacesFile)) {
    throw new errors.DepSynkyError(`Could not find ${PNPM_WORKSPACE_FILE} at "${rootDir}"`)
  }
  const pnpmWorkspacesContent = fs.readFileSync(pnpmWorkspacesFile, 'utf-8')
  const pnpmWorkspaces: string[] = yaml.parse(pnpmWorkspacesContent).packages
  const globMatches = pnpmWorkspaces.flatMap((ws) => glob.globSync(ws, { absolute: false, cwd: rootDir }))
  const absGlobMatches = globMatches.map(abs(rootDir))
  const packageJsonPaths = absGlobMatches.map((p) => pathlib.join(p, 'package.json'))
  const actualPackages = packageJsonPaths.filter(fs.existsSync)
  const absolutePaths = actualPackages.map(abs(rootDir))
  return absolutePaths.map((p) => ({ path: p, content: pkgjson.read(p) }))
}

export const findDirectReferences = (rootDir: string, pkgName: string) => {
  const workspaces = searchWorkspaces(rootDir)
  const dependency = workspaces.find((w) => w.content.name === pkgName)
  if (!dependency) {
    throw new errors.DepSynkyError(`Could not find package "${pkgName}"`)
  }
  const dependents = _findDirectDependents(workspaces, pkgName)
  return { dependency, dependents }
}

export const findRecursiveReferences = (rootDir: string, pkgName: string) => {
  const workspaces = searchWorkspaces(rootDir)
  const dependency = workspaces.find((w) => w.content.name === pkgName)
  if (!dependency) {
    throw new errors.DepSynkyError(`Could not find package "${pkgName}"`)
  }

  const visited = new sets.SetBy<PnpmWorkspace>([], (s) => s.content.name)
  const queued = new sets.SetBy<PnpmWorkspace>([dependency], (s) => s.content.name)

  while (queued.length > 0) {
    const currentPkg = queued.shift()!
    if (visited.hasKey(currentPkg.content.name)) {
      continue
    }

    visited.add(currentPkg)

    const dependents = _findDirectDependents(workspaces, currentPkg.content.name)
    for (const dependent of dependents) {
      if (!visited.hasKey(dependent.content.name) && !queued.hasKey(dependent.content.name)) {
        queued.add(dependent)
      }
    }
  }

  const dependents = visited.values.filter((w) => w.content.name !== pkgName)
  return { dependency, dependents }
}

const _findDirectDependents = (workspaces: PnpmWorkspace[], pkgName: string): PnpmWorkspace[] => {
  return workspaces.filter(
    (w) =>
      w.content.dependencies?.[pkgName] || w.content.devDependencies?.[pkgName] || w.content.peerDependencies?.[pkgName]
  )
}

export const versions = (workspaces: PnpmWorkspace[]): Record<string, string> => {
  return objects.fromEntries(workspaces.map(({ content: { name, version } }) => [name, version]))
}

export const listPublicPackages = (rootDir: string): string[] => {
  const workspaces = searchWorkspaces(rootDir)
  return workspaces.filter((w) => !w.content.private).map((w) => w.content.name)
}

export const isLocalVersion = (version: string) => version.startsWith('workspace:')
