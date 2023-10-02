import { Logger } from '@bpinternal/log4bot'
import { sleep } from '../utils'
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib from 'path'
import puppeteer from 'puppeteer'

const readTsScript = () => {
  const filePath = pathlib.join(__dirname, 'ts-script.ts')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  return fileContent
}

const toJs = async (tsScript: string): Promise<string> => {
  const buildResult = await esbuild.build({
    stdin: {
      contents: tsScript,
      resolveDir: __dirname,
      loader: 'ts'
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2017'
  })
  const jsScript = buildResult.outputFiles[0]!.text
  return jsScript
}

const launchBrowser = async (jsScript: string, logger: Logger) => {
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()
  await page.setRequestInterception(false)
  page.on('console', (msg) => logger.info(`PAGE LOG: ${msg.text()}`))
  await page.evaluate(jsScript)
  return browser
}

export const test = async (logger: Logger) => {
  const jsScript = await toJs(readTsScript())
  const browser = await launchBrowser(jsScript, logger)
  await sleep(1000) // for tunnel to connect in browser
}
