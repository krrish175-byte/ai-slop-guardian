import fs from 'node:fs'
import { exec } from 'node:child_process'
import path from 'node:path'
import crypto from 'node:crypto'
import { describe, expect, test } from '../testrunner.js'

const testTempDirectory = path.resolve(path.dirname(path.resolve(import.meta.dirname)), '..', 'tmp')

fs.mkdirSync(testTempDirectory, { recursive: true })
process.chdir(testTempDirectory)

/**
 * @typedef SetupFile
 * @property {string} filePath
 * @property {string} content
 * @property {number} [mode]
 */

/**
 * @param {string} basePath
 * @param {SetupFile[]} files
 */
function scaffoldProject(basePath, files) {
  for (const { filePath, content, mode } of files) {
    fs.mkdirSync(path.dirname(path.resolve(basePath, filePath)), { recursive: true })
    fs.writeFileSync(path.resolve(basePath, filePath), content)
    if (mode !== undefined) {
      fs.chmodSync(path.resolve(basePath, filePath), mode)
    }
  }
}

/**
 *
 * @param {string} command
 * @param {object} [options]
 * @param {string} [options.cwd] - The working directory to execute the command in
 * @returns {Promise<string>}
 */
async function execCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      stderr && console.error(stderr)
      if (error) {
        reject(error)
      } else {
        resolve(stdout.trim())
      }
    })
  })
}

/**
 * @type {string[]}
 */
const tempDirectories = []

/**
 * @param {string} runId
 * @returns {string}
 */
function createTempDir(runId) {
  const tempDir = path.resolve(testTempDirectory, fs.mkdtempSync(runId))
  tempDirectories.push(tempDir)
  return tempDir
}

describe(`integration npx`, () => {
  test(`Should run`, async () => {
    const runId = crypto.randomBytes(6).toString('hex')

    const mainPackage = createTempDir(runId)

    scaffoldProject(mainPackage, [
      {
        filePath: 'package.json',
        content: JSON.stringify(
          {
            name: 'test-npx',
            version: '1.0.0',
            type: 'module',
            main: './index.js',
            private: true,
            dependencies: {
              'npx-import': '0.0.0',
            },
            peerDependencies: {
              test: '0.0.0',
            },
          },
          undefined,
          2,
        ),
      },
      {
        filePath: 'index.js',
        content:
          "import { npxImport } from 'npx-import'\nawait npxImport('test', { onlyPackageRunner: false })\n",
      },
      {
        filePath: 'node_modules/npx-import/package.json',
        content: JSON.stringify(
          {
            name: 'npx-import',
            version: '0.0.0',
            private: true,
            main: './index.js',
            type: 'module',
          },
          undefined,
          2,
        ),
      },
      {
        filePath: 'node_modules/npx-import/index.js',
        content: fs.readFileSync(path.join(import.meta.dirname, '..', '..', 'index.js'), 'utf8'),
      },
      {
        filePath: 'node_modules/test/package.json',
        content: JSON.stringify(
          {
            name: 'test',
            version: '0.0.0',
            bin: {
              test: './index.js',
            },
            main: './index.js',
            type: 'module',
          },
          undefined,
          2,
        ),
      },
      {
        filePath: 'node_modules/test/index.js',
        content: `#!/usr/bin/env node\nimport { npxImport } from 'npx-import'\nawait npxImport('left-pad', { onlyPackageRunner: false })\nconsole.log('${runId}')`,
      },
    ])

    fs.mkdirSync(path.resolve(mainPackage, 'node_modules', '.bin'), { recursive: true })
    fs.copyFileSync(
      path.resolve(mainPackage, 'index.js'),
      path.resolve(mainPackage, 'node_modules', '.bin', 'test'),
    )

    const resNodeIndex = await execCommand('node index.js', {
      cwd: mainPackage,
    })
    expect(resNodeIndex.slice(-runId.length)).toBe(runId)

    await execCommand('npm link', {
      cwd: mainPackage,
    })

    const projectPackage = createTempDir(runId)

    scaffoldProject(projectPackage, [
      {
        filePath: 'package.json',
        content: JSON.stringify(
          {
            name: 'test-case',
            version: '1.0.0',
            type: 'module',
            private: true,
            main: './index.js',
            bin: {
              'test-case': 'index.js',
            },
          },
          undefined,
          2,
        ),
      },
      {
        filePath: 'index.js',
        content: "#!/usr/bin/env node\nawait import('test-npx')",
      },
    ])

    fs.mkdirSync(path.resolve(projectPackage, 'node_modules', '.bin'), { recursive: true })
    fs.copyFileSync(
      path.resolve(projectPackage, 'index.js'),
      path.resolve(projectPackage, 'node_modules', '.bin', 'test-case'),
    )

    await execCommand('npm link test-npx', {
      cwd: projectPackage,
    })

    const result = await execCommand('npx test-case', {
      cwd: projectPackage,
    })

    expect(result.slice(-runId.length)).toBe(runId)

    for (const tempDirectory of tempDirectories) {
      fs.rmSync(tempDirectory, { recursive: true, force: true })
    }
  })
})
