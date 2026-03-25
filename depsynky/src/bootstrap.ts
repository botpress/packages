import * as app from './application'
import * as repo from './infrastructure'
import * as config from './config'

export const bootstrap = async (argv: config.CommonConfig) => {
  const promptRepo = new repo.PromptStdinRepo()
  const pkgJsonRepo = new repo.PackageJsonFsRepo()
  const pnpmRepo = new repo.PnpmFsRepo(pkgJsonRepo, argv.rootDir)
  const application = new app.DepSynkyApplication(pnpmRepo, pkgJsonRepo, promptRepo)
  return {
    app: application,
    promptRepo,
    pkgJsonRepo,
    pnpmRepo
  }
}
