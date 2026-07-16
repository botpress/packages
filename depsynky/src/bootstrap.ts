import * as app from './application'
import * as repo from './infrastructure'
import * as config from './config'

export const bootstrap = async (argv: config.CommonConfig) => {
  const promptRepo = new repo.PromptStdinRepo()
  const fs = new repo.FsRepo()

  const pkgJsonService = new app.PackageJsonService(fs)
  const pnpmWorkspaceService = new app.PnpmWorkspaceService(pkgJsonService, fs, argv.rootDir)
  const bumpService = new app.BumpService(promptRepo)

  const application = new app.DepSynkyApplication(pnpmWorkspaceService, pkgJsonService, bumpService)
  return {
    app: application,
    pnpm: pnpmWorkspaceService,
    pkgJson: pkgJsonService
  }
}
