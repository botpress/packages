import {
  ConstructorDeclaration,
  ClassDeclaration,
  FunctionDeclaration,
  MethodDeclaration,
  Project,
  SourceFile,
  ScriptTarget,
  StructureKind,
  ts
} from 'ts-morph'
import outdent from 'outdent'
import path from 'path'
import fs from 'fs'

// Patches {projectName}_bg.js file to check if wasm is initialized before calling any function
function patchBGFile(project: Project, path: string): SourceFile {
  const source = project.addSourceFileAtPath(path)
  const classes = getExportedSymbols(source, 'class')

  for (const classSymbol of classes) {
    for (const method of classSymbol.getMethods()) {
      prependWASMInitCheck(method)
    }
    for (const constructorSymbol of classSymbol.getConstructors()) {
      prependWASMInitCheck(constructorSymbol)
    }
  }
  const functions = getExportedSymbols(source, 'function')
  for (const fn of functions) {
    prependWASMInitCheck(fn)
  }
  return source
}

// Generates {projectName}_bg.cjs file from {projectName}_bg.js file to be used in nodejs (CommonJS)
function generateCommonJSBGFile(project: Project, path: string): SourceFile {
  const source = project.addSourceFileAtPath(path)

  const classes = getExportedSymbols(source, 'class')

  for (const classSymbol of classes) {
    classSymbol.set({
      ...classSymbol.getStructure(),
      kind: StructureKind.Class,
      isExported: false
    })

    source.insertStatements(classSymbol.getChildIndex() + 1, [
      `module.exports.${classSymbol.getName()} = ${classSymbol.getName()};`
    ])
  }

  const functions = getExportedSymbols(source, 'function')

  for (const fn of functions) {
    fn.set({
      ...fn.getStructure(),
      kind: StructureKind.Function,
      isExported: false
    })

    source.insertStatements(fn.getChildIndex(), [`module.exports.${fn.getName()} = ${fn.getText()};`])

    source
      .getDescendantsOfKind(ts.SyntaxKind.FunctionExpression)
      .filter((x) => x.getName() === fn.getName())
      .forEach((f) => f.removeName())

    fn.remove()
  }
  return source
}

function getTypescriptDeclarationPublicExports(declarationFile: SourceFile) {
  return declarationFile
    .getExportSymbols()
    .filter((sym) =>
      sym
        .getDeclarations()
        .some((dcl) => dcl.isKind(ts.SyntaxKind.ClassDeclaration) || dcl.isKind(ts.SyntaxKind.FunctionDeclaration))
    )
    .map((i) => i.getName())
}

function generateMainCJSFile(
  project: Project,
  path: string,
  projectName: string,
  outputModuleName: string,
  publicExports: string[]
): SourceFile {
  return project.createSourceFile(
    path,
    outdent`
        const wasm = require("./${projectName}_bg.cjs");
        let imports = {};
        imports["./${projectName}_bg.js"] = wasm;
        const path = require("path");
        const fs = require("fs");
        
        const candidates = __dirname
          .split(path.sep)
          .reduce((memo, _, index, array) => {
            const prefix = array.slice(0, index + 1).join(path.sep) + path.sep;
            if (!prefix.includes("node_modules" + path.sep)) {
              memo.unshift(
                path.join(
                  prefix,
                  "node_modules",
                  "@bpinternal",
                  "${outputModuleName}",
                  "./${projectName}_bg.wasm"
                )
              );
            }
            return memo;
          }, [])
        candidates.unshift(path.join(__dirname, "./${projectName}_bg.wasm"));
        
        let bytes = null;
        for (const candidate of candidates) {
          try {
            bytes = fs.readFileSync(candidate);
            break;
          } catch {}
        }
        
        if (bytes == null) throw new Error("Missing ${projectName}_bg.wasm");
        const wasmModule = new WebAssembly.Module(bytes);
        const wasmInstance = new WebAssembly.Instance(wasmModule, imports);
        wasm.__wbg_set_wasm(wasmInstance.exports);
      ` +
      '\n' +
      publicExports.map((name) => `exports["${name}"] = wasm["${name}"];`).join('\n')
  )
}

function writeCJSInitFile(
  baseDir: string,
  publicExports: string[],
  projectName: string,
  moduleTypes: ts.ModuleKind[] = [ts.ModuleKind.CommonJS, ts.ModuleKind.ES2022]
) {
  for (const module of moduleTypes) {
    const source = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2022,
        module,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        strict: true,
        declaration: true
      }
    }).addSourceFileAtPath(path.resolve(__dirname, '../src/init.ts'))

    const emitOutput = source.getEmitOutput()

    for (const file of emitOutput.getOutputFiles()) {
      let targetFile = path.basename(file.getFilePath())

      let source = file.getText()

      if (module === ts.ModuleKind.CommonJS) {
        targetFile = targetFile.replace('.js', '.cjs')
        source = source
          .replace(new RegExp(`"./${projectName}_bg"`, 'g'), `"./${projectName}_bg.cjs"`)
          .replace(
            /exports.init = init;/g,
            `exports.init = init;\n${publicExports
              .map((name) => `exports["${name}"] = imports["${name}"];`)
              .join('\n')}`
          )
      }
      fs.writeFileSync(path.resolve(baseDir, targetFile), source, {
        encoding: 'utf-8'
      })
    }
  }
}

function prependWASMInitCheck(declaration: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration) {
  if (declaration instanceof FunctionDeclaration && declaration.getName() === '__wbg_set_wasm') return

  const statements = declaration
    .getDescendantsOfKind(ts.SyntaxKind.Identifier)
    .filter((ident) => ident.getText() === 'wasm')

  if (statements.length === 0) return

  declaration.insertStatements(0, `if (typeof wasm === 'undefined') throw new Error('wasm not initialized')`)
}

function getExportedSymbols<T extends 'class' | 'function'>(
  sourceFile: SourceFile,
  type: T
): T extends 'class' ? ClassDeclaration[] : FunctionDeclaration[] {
  if (type === 'class') {
    return sourceFile.getClasses().filter((cls) => cls.isExported()) as any
  }
  return sourceFile.getFunctions().filter((fn) => fn.isExported()) as any
}

function patchPackageJSON(filepath: string, projectName: string) {
  const pkg = JSON.parse(fs.readFileSync(filepath, 'utf-8'))

  delete pkg.devDependencies
  delete pkg.scripts
  pkg.files = ['**/*']
  pkg['name'] = '@bpinternal/entities-wasm'
  pkg['main'] = `${projectName}.cjs`
  pkg['types'] = `${projectName}.d.ts`
  pkg['exports'] = {
    '.': {
      types: `./${projectName}.d.ts`,
      node: `./${projectName}.cjs`,
      default: `./${projectName}.js`
    },
    './init': {
      types: './init.d.ts',
      node: './init.cjs',
      default: './init.js'
    },
    [`./${projectName}_bg.wasm`]: {
      types: `./${projectName}_bg.wasm.d.ts`,
      default: `./${projectName}_bg.wasm`
    },
    [`./${projectName}_bg.wasm?module`]: {
      types: `./${projectName}_bg.wasm.d.ts`,
      default: `./${projectName}_bg.wasm?module`
    }
  }
  fs.writeFileSync(filepath, JSON.stringify(pkg, null, 2), { encoding: 'utf-8' })
}

function patchWASMDefinitionFile(baseDir: string, projectName: string) {
  fs.writeFileSync(path.resolve(baseDir, `${projectName}_bg.d.ts`), `export * from "./${projectName}";`.trim(), {
    encoding: 'utf-8'
  })
}

function main() {
  const baseDir = path.resolve(__dirname, '../dist')
  const projectName = 'entities'
  const declarationFile = new Project().addSourceFileAtPath(path.resolve(baseDir, `${projectName}.d.ts`))

  const publicExports = getTypescriptDeclarationPublicExports(declarationFile)

  const bgFile = patchBGFile(new Project(), path.resolve(baseDir, `${projectName}_bg.js`))
  bgFile.saveSync()

  const cjsBGFile = generateCommonJSBGFile(new Project(), path.resolve(baseDir, `${projectName}_bg.js`))
  cjsBGFile.copy(path.resolve(baseDir, `${projectName}_bg.cjs`), { overwrite: true }).saveSync()

  const mainCJSFile = generateMainCJSFile(
    new Project(),
    path.resolve(baseDir, `${projectName}.cjs`),
    projectName,
    'entities-wasm',
    publicExports
  )

  mainCJSFile.copy(path.resolve(baseDir, `${projectName}.cjs`), { overwrite: true }).saveSync()

  writeCJSInitFile(baseDir, publicExports, projectName)

  patchPackageJSON(path.resolve(baseDir, './package.json'), projectName)
  patchWASMDefinitionFile(baseDir, projectName)
}

main()
