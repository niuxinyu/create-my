import { exec } from 'node:child_process';
import { readFileSync, writeFileSync, statSync, mkdir, copyFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { detectNewline } from 'detect-newline';
import detectIndent from 'detect-indent';
const execAsync = promisify(exec);
const root = process.cwd();
function readFileString(path) {
    return {
        data: readFileSync(path).toString(),
        path,
    };
}
function readFileJSON(path) {
    const { data } = readFileString(path);
    const newLine = detectNewline(data);
    const indent = detectIndent(data).indent;
    return {
        data: JSON.parse(data),
        newLine,
        indent,
    };
}
function isFileExit(path) {
    try {
        return readFileString(path);
    }
    catch (e) {
        return false;
    }
}
function isDirExit(path) {
    try {
        const stat = statSync(path);
        if (stat && stat.isDirectory()) {
            return true;
        }
        return true;
    }
    catch (e) {
        return false;
    }
}
function getRootPath(name) {
    return resolve(root, name);
}
function getTemplatePath() {
    return resolve(fileURLToPath(import.meta.url), '../..', 'template-my');
}
async function runCommand(command) {
    await execAsync(command).catch((e) => console.error(e));
}
const eslintrcs = [
    '.eslintrc',
    '.eslintrc.json',
    '.eslintrc.js',
    '.eslintrc.mjs',
    '.eslintrc.cjs'
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
];
const vscodes = [
    'settings.json',
];
function addESlint() {
    if (!eslintrcs.some((c) => isFileExit(c))) {
        const eslintrc = readFileString(join(getTemplatePath(), eslintrcs[0]));
        if (eslintrc) {
            writeFileSync(join(root, eslintrcs[0]), eslintrc.data);
        }
    }
}
function addPrettier() {
    if (!prettierrcs.some((c) => isFileExit(c))) {
        const prettierrc = readFileString(join(getTemplatePath(), prettierrcs[0]));
        if (prettierrc) {
            writeFileSync(join(root, prettierrcs[0]), prettierrc.data);
        }
    }
}
function addEditorConfig() {
    if (!editorconfigs.some((c) => isFileExit(c))) {
        const editorconfig = readFileString(join(getTemplatePath(), editorconfigs[0]));
        if (editorconfig) {
            writeFileSync(join(root, editorconfigs[0]), editorconfig.data);
        }
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
    writeFileSync(join(root, './package.json'), json);
}
function addGitIgnore() {
    const src = join(getTemplatePath(), './.gitignore');
    const path = join(root, './.gitignore');
    if (!isFileExit(path)) {
        const gitignore = readFileString(src);
        if (gitignore.data) {
            writeFileSync(path, gitignore.data);
        }
    }
}
function addVsCode() {
    const dir = '.vscode';
    const path = join(root, `./${dir}`);
    const src = join(getTemplatePath(), `./${dir}`);
    if (isDirExit(getRootPath('./.vscode'))) {
        console.log('.vscode 目录存在,跳过...');
    }
    else {
        mkdir(path, undefined, (err) => {
            if (err) {
                console.error(err);
            }
            vscodes.forEach((c) => {
                copyFileSync(join(src, `./${c}`), join(path, `./${c}`));
            });
        });
    }
}
async function init() {
    addESlint();
    addPrettier();
    addEditorConfig();
    addPackageJSON();
    addGitIgnore();
    addVsCode();
    await runCommand('git add .');
    console.log('🥳...Done!!');
}
try {
    init();
}
catch (e) {
    console.error(e);
}
