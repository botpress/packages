import * as types from '../types'

export const PNPM_WORKSPACE_FILE = 'pnpm-workspace.yaml'
export const LOCAL_VERSION_PREFIX = 'workspace:'

export const findDirectDependents = (workspaces: types.PnpmWorkspace[], pkgName: string): types.PnpmWorkspace[] => {
  return workspaces.filter(
    (w) =>
      w.content.dependencies?.[pkgName] || w.content.devDependencies?.[pkgName] || w.content.peerDependencies?.[pkgName]
  )
}

export const isLocalVersion = (version: string) => version.startsWith(LOCAL_VERSION_PREFIX)
