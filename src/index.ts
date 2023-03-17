import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import detectIndent from 'detect-indent';
import { detectNewline } from 'detect-newline';

const root = process.cwd();

function readFileString(path: string) {
  return {
    data: readFileSync(path).toString(),
    path,
  };
}

function readFileJSON(path: string) {
  const { data } = readFileString(path);
  const newLine = detectNewline(data);
  const indent = detectIndent(data).indent;
  return {
    data: JSON.parse(data),
    newLine,
    indent,
  };
}

function isFileExit(path: string) {
  try {
    return readFileString(path);
  } catch (e) {
    return false;
  }
}

function isDirExit(path: string) {
  try {
    const stat = statSync(path);
    if (stat && stat.isDirectory()) {
      return true;
    }
    return true;
  } catch (e) {
    return false;
  }
}

function getRootPath(name: string) {
  return resolve(root, name);
}

function getTemplatePath() {
  return resolve(
    fileURLToPath(import.meta.url),
    '../..',
    'template-my',
  );
}

function addToGit(command: string) {
  if (isDirExit(join(root, '.git'))) {
    execSync('git add .');
  } else {
    execSync('git init && git add .');
  }
  log('🚚\u0020\u0020Git 完成...');
}

function log(...args: any) {
  // eslint-disable-next-line no-console
  console.log(...args);
}

// 先考虑这几种
// TODO 已经在 package.json 中配置的 eslint 将会被忽略
const eslintrcs = [
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.mjs',
  '.eslintrc.cjs',
];

const prettierrcs = [
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  '.prettierrc.cjs',
  '.prettierrc.mjs',
];

const editorconfigs = [
  '.editorconfig',
];

const packages = [
  {
    name: 'eslint',
    version: '^8.36.0',
  },
  {
    name: 'prettier',
    version: '^2.8.4',
  },
  {
    name: '@koalan/eslint-config',
    version: '*',
  },
  {
    name: '@koalan/prettier-config',
    version: '*',
  },
];

const vscodes = [
  'settings.json',
  // 'extensions.json',
];

function addESlint() {
  if (!eslintrcs.some((c) => isFileExit(c))) {
    const eslintrc = readFileString(join(getTemplatePath(), eslintrcs[0]));
    if (eslintrc) {
      writeFileSync(
        join(root, eslintrcs[0]),
        eslintrc.data,
      );
      log('🚚\u0020\u0020ESLint 完成...');
    }
  } else {
    log('🛠️\u0020\u0020ESLint 跳过...');
  }
}

function addPrettier() {
  if (!prettierrcs.some((c) => isFileExit(c))) {
    const prettierrc = readFileString(join(getTemplatePath(), prettierrcs[0]));
    if (prettierrc) {
      writeFileSync(
        join(root, prettierrcs[0]),
        prettierrc.data,
      );
      log('🚚\u0020\u0020Prettier 完成...');
    }
  } else {
    log('🛠️\u0020\u0020Prettier 跳过...');
  }
}

function addEditorConfig() {
  if (!editorconfigs.some((c) => isFileExit(c))) {
    const editorconfig = readFileString(join(getTemplatePath(), editorconfigs[0]));
    if (editorconfig) {
      writeFileSync(
        join(root, editorconfigs[0]),
        editorconfig.data,
      );
      log('🚚\u0020\u0020EditorConfig 完成...');
    }
  } else {
    log('🛠️\u0020\u0020EditorConfig 跳过...');
  }
}

function addPackageJSON() {
  const { data, newLine, indent } = readFileJSON(join(root, './package.json'));
  const devPkg = data.devDependencies;
  packages.forEach((p) => {
    devPkg[p.name] = devPkg[p.name] ?? p.version;
  });

  let json = JSON.stringify(data, undefined, indent);
  if (newLine) {
    json += newLine;
  }

  writeFileSync(
    join(root, './package.json'),
    json,
  );
}

function addGitIgnore() {
  const src = join(getTemplatePath(), './.gitignore');
  const path = join(root, './.gitignore');
  if (!isFileExit(path)) {
    const gitignore = readFileString(src);
    if (gitignore.data) {
      writeFileSync(
        path,
        gitignore.data,
      );
      log('🚚\u0020\u0020Gitignore 完成...');
    }
  } else {
    log('🛠️\u0020\u0020Gitignore 跳过...');
  }
}

function addVsCode() {
  const dir = '.vscode';
  const path = join(root, `./${dir}`);
  const src = join(getTemplatePath(), `./${dir}`);
  if (!isDirExit(getRootPath('./.vscode'))) {
    mkdirSync(path, undefined);
    vscodes.forEach((c) => {
      copyFileSync(
        join(src, `./${c}`),
        join(path, `./${c}`),
      );
    });
    log('🚚\u0020\u0020.vscode 完成...');
  } else {
    log('🛠️\u0020\u0020.vscode 跳过...');
  }
}

function init() {
  addESlint();
  addPrettier();
  addEditorConfig();
  addPackageJSON();
  addGitIgnore();
  addVsCode();
  addToGit('git add .');
  log('🥳\u0020\u0020...All Done!!');
}

try {
  init();
} catch (e) {
  console.error(e);
}
