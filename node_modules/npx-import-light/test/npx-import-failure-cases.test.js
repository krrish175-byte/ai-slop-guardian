import os from 'node:os'
import crypto from 'node:crypto'
import { describe, expect, test } from './testrunner.js'
import { npxImport } from '../index.js'
import { getBasePath, getNpxPath } from './utils.js'

const printPathCmd = os.platform() === 'win32' ? 'set PATH' : 'printenv PATH'

describe('failure cases', () => {
  /**
   * @param {string | string[]} pkg
   * @param {string} errorMatcher
   * @param {Record<keyof import('../index.js').Options, any>} options
   */
  async function npxImportFailed(pkg, errorMatcher, options) {
    options.import.mockRejectedValueOnce('not-found')
    await expect(npxImport(pkg, options)).rejects.toThrowError(errorMatcher)
    expect(options.import).toHaveBeenCalled()
  }

  test(`Should fail for the same package passed twice`, async () => {
    for (const pkgs of [
      ['pkg-a', 'pkg-a'],
      ['pkg-a@latest', 'pkg-a'],
      ['pkg-a', 'pkg-a@latest'],
      ['pkg-a/path.js', 'pkg-a/other.js'], // Arguably, we could make this one work in future.
    ]) {
      let importCalls = 0

      const options = {
        onlyPackageRunner: false,
        logger: { log: () => {} },
        import: async (name, opts) => {
          importCalls++
          throw new Error('not-found')
        },
      }

      await expect(npxImport(pkgs, options)).rejects.toThrowError(
        `cannot import the same package twice! Got: '${pkgs[1]}' but already saw 'pkg-a' earlier!`,
      )
      expect(importCalls).toBe(0)
    }
  })

  test(`Should fail if NPX can't be found`, async () => {
    if (process.versions.bun !== undefined) {
      return
    }
    await expect(
      npxImport('no-npx-existo', {
        onlyPackageRunner: false,
        logger: { log: () => {} },
        exec: (path, opts, cb) => {
          cb(new Error(`Command '${path}' failed with error: Command not found`))
        },
      }),
    ).rejects.toThrowError(`Couldn't execute 'npx --version'. Is npm installed and up-to-date?`)
  })

  test(`Should fail if NPX is old`, async () => {
    if (process.versions.bun !== undefined) {
      return
    }

    await expect(
      npxImport('npm-too-old', {
        onlyPackageRunner: false,
        logger: { log: () => {} },
        exec: (path, opts, cb) => {
          if (path === 'npx --version') {
            cb(null, '6.1.2')
            return
          }
          cb(new Error(`Command '${path}' failed with error: Command not found`))
        },
      }),
    ).rejects.toThrowError(`Require npm version 7+. Got '6.1.2' when running 'npx --version'`)
  })

  test(`Should attempt to install, passing through whatever happens`, async () => {
    const options = await expect(
      npxImport('broken-install@^2.0.0', {
        onlyPackageRunner: false,
        logger: { log: () => {} },
        exec: (path, opts, cb) => {
          if (path === 'npx --version') {
            cb(null, '8.1.2')
            return
          }
          if (path === `npx --prefer-online -y -p broken-install@^2.0.0 ${printPathCmd}`) {
            cb(new Error('EXPLODED TRYING TO INSTALL'))
          }
          cb(new Error(`Command '${path}' failed with error: Command not found`))
        },
      }),
    ).rejects.toThrowError(
      `Failed installing 'broken-install' using: npx --prefer-online -y -p broken-install@^2.0.0.`,
    )
  })

  test(`Should include tag in error instructions`, async () => {
    await expect(
      npxImport(
        'left-pad@this-tag-no-exist',

        {
          onlyPackageRunner: false,
          logger: { log: () => {} },
          exec: (command, opts, cb) => {
            if (command === 'npx --version') {
              cb(null, '8.1.2')
              return
            }
            if (
              command === `npx --prefer-online -y -p left-pad@this-tag-no-exist ${printPathCmd}`
            ) {
              throw new Error('No matching version found for left-pad@this-tag-no-exist.')
            }
            throw new Error(`Command '${command}' failed with error: Command not found`)
          },
        },
      ),
    ).rejects.toThrowError('You should install left-pad locally: ')
  })

  test(`Should not include path in error instructions`, async () => {
    const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
    const basePath = getBasePath(npxDirectoryHash)

    await expect(
      npxImport(
        '@org/pkg@my-tag/weird-path.js',

        {
          onlyPackageRunner: false,
          logger: { log: () => {} },
          importRelative: (base, sub) => {
            if (base === basePath && sub === '@org/pkg/weird-path.js') {
              throw new Error(
                `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`,
              )
            }
            throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
          },
          exec: (path, opts, cb) => {
            if (path === 'npx --version') {
              cb(null, '8.1.2')
              return
            }

            if (path === `npx --prefer-online -y -p @org/pkg@my-tag ${printPathCmd}`) {
              cb(null, getNpxPath(npxDirectoryHash))
              return
            }
          },
        },
      ),
    ).rejects.toThrowError(
      `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '${basePath}/weird-path.js'`,
    )
  })
})
