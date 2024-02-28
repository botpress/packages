// Import puppeteer
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib from 'path'
import puppeteer from 'puppeteer'

const readTsScript = () => {
  const filePath = pathlib.join(__dirname, 'script.ts')
  return fs.readFileSync(filePath, 'utf8')
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

const launchBrowser = async (jsScript: string) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(false)
  page.on('console', (msg) => console.log(`PAGE LOG: ${msg.text()}`))
  await page.evaluate(jsScript)
  return browser
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const main = async () => {
  const jsScript = await toJs(readTsScript())
  const browser = await launchBrowser(jsScript)
  await sleep(2000)
  browser.close()
}

void main()
  .then(() => {
    console.log('done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
