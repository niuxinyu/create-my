import { execSync } from 'node:child_process'
import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import detectIndent from 'detect-indent'
import { detectNewline } from 'detect-newline'

const pkgPath = resolve(
  fileURLToPath(import.meta.url),
  '../..',
  'package.json',
)

const root = process.cwd()

function readFileString(path: string) {
  return {
    data: readFileSync(path).toString(),
    path,
  }
}

function readFileJSON(path: string) {
  const { data } = readFileString(path)
  const newLine = detectNewline(data)
  const indent = detectIndent(data).indent
  return {
    data: JSON.parse(data),
    newLine,
    indent,
  }
}

function log(...args: unknown[]) {
  globalThis.console.log(...args)
}

const version = process.argv.slice(2)
const versions = ['--version', '-v']
if (Array.isArray(version) && versions.includes(version[0])) {
  const pkg = readFileJSON(pkgPath)
  if (pkg && pkg.data) {
    log(pkg.data.version)
    process.exit(0)
  }
}

function isFileExit(path: string) {
  try {
    return !!readFileString(path)
  } catch (e) {
    return false
  }
}

function isDirExit(path: string) {
  try {
    const stat = statSync(path)
    if (stat && stat.isDirectory()) {
      return true
    }
    return true
  } catch (e) {
    return false
  }
}

function getRootPath(name: string) {
  return resolve(root, name)
}

function getTemplatePath() {
  return resolve(
    fileURLToPath(import.meta.url),
    '../..',
    'template-my',
  )
}

function addToGit() {
  if (isDirExit(join(root, '.git'))) {
    execSync('git add .')
  } else {
    execSync('git init && git add .')
  }
  log('🚚 \u0020\u0020Git init success...')
}

// 先考虑这几种
const eslintrcs = [
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.mjs',
  '.eslintrc.cjs',
]

const prettierrcs = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
]

const editorconfigs = [
  '.editorconfig',
]

const packages = [
  {
    name: 'eslint',
    version: '^8.36.0',
  },
  {
    name: '@koalan/eslint-config',
    version: 'latest',
  },
]

const vscodes = [
  'settings.json',
]

function addESlint() {
  if (!eslintrcs.some((c) => isFileExit(c))) {
    const eslintrc = readFileString(join(getTemplatePath(), eslintrcs[0]))
    if (eslintrc) {
      writeFileSync(
        join(root, eslintrcs[0]),
        eslintrc.data,
      )
      log('🚚 eslint init success ...')
    }
  } else {
    log('🛠️ already have eslint config ...')
  }
}

function addPrettier() {
  if (!prettierrcs.some((c) => isFileExit(c))) {
    const prettierrc = readFileString(join(getTemplatePath(), prettierrcs[0]))
    if (prettierrc) {
      writeFileSync(
        join(root, prettierrcs[0]),
        prettierrc.data,
      )
      log('🚚 prettier init success ...')
    }
  } else {
    log('🛠️ already have prettier config ...')
  }
}

function addEditorConfig() {
  if (!editorconfigs.some((c) => isFileExit(c))) {
    const editorconfig = readFileString(
      join(getTemplatePath(),
        editorconfigs[0]),
    )

    if (editorconfig) {
      writeFileSync(
        join(root, editorconfigs[0]),
        editorconfig.data,
      )
      log('🚚 editorconfig init success ...')
    }
  } else {
    log('🛠️ already have editorconfig ...')
  }
}

function addPackageJSON() {
  const packageJsonRoot = join(root, './package.json')
  if (!isFileExit(packageJsonRoot)) {
    log('No package.json found... ')
    throw new Error('No package.json found... ')
  }
  const { data, newLine, indent } = readFileJSON(packageJsonRoot)
  const devPkg = data.devDependencies ?? (data.devDependencies = {})
  packages.forEach((p) => {
    devPkg[p.name] = devPkg[p.name] ?? p.version
  })

  let json = JSON.stringify(data, undefined, indent)
  if (newLine) {
    json += newLine
  }

  writeFileSync(
    join(root, './package.json'),
    json,
  )
}

function addGitIgnore() {
  const src = join(getTemplatePath(), './.gitignore')
  const path = join(root, './.gitignore')
  if (!isFileExit(path)) {
    const gitignore = readFileString(src)
    if (gitignore.data) {
      writeFileSync(
        path,
        gitignore.data,
      )
      log('🚚 .gitignore init success ...')
    }
  } else {
    log('🛠️ already have .gitignore...')
  }
}

function addVsCode() {
  const dir = '.vscode'
  const path = join(root, `./${dir}`)
  const src = join(getTemplatePath(), `./${dir}`)
  if (!isDirExit(getRootPath('./.vscode'))) {
    mkdirSync(path, undefined)
    vscodes.forEach((c) => {
      copyFileSync(
        join(src, `./${c}`),
        join(path, `./${c}`),
      )
    })
    log('🚚 .vscode init success ...')
  } else {
    log('🛠️ already have .vscode ...')
  }
}

function init() {
  addPackageJSON()
  addESlint()
  // addPrettier()
  addEditorConfig()
  addGitIgnore()
  addVsCode()
  addToGit()
  log('🥳 ... All Done!!!')
}

try {
  init()
} catch (e) {
  console.error(e)
}
