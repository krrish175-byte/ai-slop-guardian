import os from 'node:os'
import crypto from 'node:crypto'
import { describe, expect, test } from './testrunner.js'
import { getBasePath, getNpxPath } from './utils.js'
import { npxImport, npxResolve } from '../index.js'

export const printPathCmd = os.platform() === 'win32' ? 'set PATH' : 'printenv PATH'

describe(`npxResolve`, () => {
  test(`Should return one local one new directory`, async () => {
    const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
    const basePath = getBasePath(npxDirectoryHash)

    let importCalls = 0

    const options = {
      logger: { log: () => {} },
      import: async (name, opts) => {
        importCalls++
        if (name === 'pkg-a') {
          return {}
        } else if (name === 'pkg-b') {
          throw new Error('not-found')
        }
        throw new Error(
          `Unexpected import call with name: ${name} and options: ${JSON.stringify(opts)}`,
        )
      },
      importRelative: async (base, sub) => {
        if (base === basePath && sub === 'pkg-b') {
          return { name: 'pkg-b', bar: 2, local: false }
        }
        throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
      },
      resolve: (name) => {
        if (name === 'pkg-a') {
          return '/Users/glen/src/npx-import/pkg-a'
        }
        if (name === 'pkg-b') {
          return `${basePath}/pkg-b`
        }
        throw new Error(`Unexpected resolve call with name: ${name}`)
      },
      resolveRelative: (base, sub) => {
        if (base === basePath && sub === 'pkg-b') {
          return `${basePath}/pkg-b`
        }
        throw new Error(`Unexpected resolveRelative call with base: ${base}, sub: ${sub}`)
      },
      exec: (command, options, cb) => {
        if (command === 'npx --version') {
          cb(null, '8.1.2')
          return
        } else if (command === `npx --prefer-online -y -p pkg-b@latest ${printPathCmd}`) {
          cb(null, getNpxPath(npxDirectoryHash))
          return
        }
        cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
      },
      onlyPackageRunner: false,
    }

    await npxImport(['pkg-a', 'pkg-b'], options)
    expect(importCalls).toBe(2)

    const localPath = npxResolve('pkg-a', options)
    expect(localPath).toBe('/Users/glen/src/npx-import/pkg-a')

    const tempPath = npxResolve('pkg-b', options)
    expect(tempPath).toBe(`${basePath}/pkg-b`)
  })

  test('Should throw if invalid package name', async () => {
    expect(() => npxResolve(undefined)).toThrowError(/can't resolve invalid package name/)
    expect(() => npxResolve('.invalid')).toThrowError(
      /cannot import relative paths: got '\.invalid'/,
    )
  })

  test('Should throw if no package found', async () => {
    expect(() => npxResolve('not-loaded-package')).toThrowError(
      /You must call import for the package 'not-loaded-package' before calling resolve/,
    )
  })
})
