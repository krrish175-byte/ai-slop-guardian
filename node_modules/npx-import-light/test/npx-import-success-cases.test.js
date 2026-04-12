import crypto from 'node:crypto'
import { describe, expect, test } from './testrunner.js'
import { getNpxPath, getBasePath, printPathCmd } from './utils.js'
import { npxImport } from '../index.js'

describe(`npxImport`, () => {
  describe('success cases', () => {
    test(`Should call relative import and return`, async () => {
      const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
      const basePath = getBasePath(npxDirectoryHash)

      let importCalls = 0
      const logs = []

      const imported = await npxImport('@org/pkg@my-tag/lib/index.js', {
        logger: {
          log: Array.prototype.push.bind(logs),
        },
        onlyPackageRunner: false,
        import: async (name) => {
          ++importCalls
          if (name === '@org/pkg/lib/index.js') {
            throw new Error('not-found')
          }
          throw new Error(`Unexpected import call with name: ${name}`)
        },
        importRelative: async (base, sub) => {
          if (base === basePath && sub === '@org/pkg/lib/index.js') {
            return { foo: 1, bar: 2 }
          }
          throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
        },
        exec: (command, options, cb) => {
          if (command === 'npx --version') {
            cb(null, '8.1.2')
            return
          } else if (command === `npx --prefer-online -y -p @org/pkg@my-tag ${printPathCmd}`) {
            cb(null, getNpxPath(npxDirectoryHash))
            return
          }
          cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
          return
        },
      })

      expect(importCalls).toBe(1)
      expect(imported).toStrictEqual({ foo: 1, bar: 2 })

      const logsString = logs.join('\n')

      for (const line of [
        `@org/pkg/lib/index.js not available locally. Attempting to use npx to install temporarily.`,
        `Installing... (npx --prefer-online -y -p @org/pkg@my-tag)`,
        `Installed into ${basePath}.`,
        `To skip this step in future, run: npm install @org/pkg@my-tag`,
      ]) {
        expect(logsString.includes(line)).toBe(true)
      }
    })

    test(`Should prefer offline for exact versions`, async () => {
      const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
      const basePath = getBasePath(npxDirectoryHash)

      let importCalls = 0
      const logs = []

      const imported = await npxImport('@org/pkg@3.0.1/lib/index.js', {
        logger: {
          log: Array.prototype.push.bind(logs),
        },
        onlyPackageRunner: false,
        import: async (name) => {
          ++importCalls
          if (name === '@org/pkg/lib/index.js') {
            throw new Error('not-found')
          }
          throw new Error(`Unexpected import call with name: ${name}`)
        },
        importRelative: async (base, sub) => {
          if (base === basePath && sub === '@org/pkg/lib/index.js') {
            return { foo: 1, bar: 2 }
          }
          throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
        },
        exec: (command, options, cb) => {
          if (command === 'npx --version') {
            cb(null, '8.1.2')
            return
          } else if (command === `npx --prefer-offline -y -p @org/pkg@3.0.1 ${printPathCmd}`) {
            cb(null, getNpxPath(npxDirectoryHash))
            return
          }
          cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
          return
        },
      })

      expect(importCalls).toBe(1)
      expect(imported).toStrictEqual({ foo: 1, bar: 2 })

      const logsString = logs.join('\n')

      for (const line of [
        `@org/pkg/lib/index.js not available locally. Attempting to use npx to install temporarily.`,
        `Installing... (npx --prefer-offline -y -p @org/pkg@3.0.1)`,
        `Installed into ${basePath}.`,
        `To skip this step in future, run: npm install @org/pkg@3.0.1`,
      ]) {
        expect(logsString.includes(line), logsString).toBe(true)
      }
    })

    test(`Should install two packages`, async () => {
      const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
      const basePath = getBasePath(npxDirectoryHash)

      let importCalls = 0
      const logs = []

      const imported = await npxImport(['pkg-a', 'pkg-b'], {
        logger: {
          log: Array.prototype.push.bind(logs),
        },
        onlyPackageRunner: false,
        import: async (name) => {
          ++importCalls
          throw new Error('not-found')
        },
        importRelative: async (base, sub) => {
          if (base === basePath && sub === 'pkg-a') {
            return { name: 'pkg-a', foo: 1 }
          } else if (base === basePath && sub === 'pkg-b') {
            return { name: 'pkg-b', bar: 2 }
          }
          throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
        },
        exec: (command, options, cb) => {
          if (command === 'npx --version') {
            cb(null, '8.1.2')
            return
          } else if (
            command === `npx --prefer-online -y -p pkg-a@latest -p pkg-b@latest ${printPathCmd}`
          ) {
            cb(null, getNpxPath(npxDirectoryHash))
            return
          }
          cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
          return
        },
      })

      expect(importCalls).toBe(2)

      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1 },
        { name: 'pkg-b', bar: 2 },
      ])

      const logsString = logs.join('\n')

      for (const line of [
        `Packages pkg-a, pkg-b not available locally. Attempting to use npx to install temporarily.`,
        `Installing... (npx --prefer-online -y -p pkg-a@latest -p pkg-b@latest)`,
        `Installed into ${basePath}.`,
        `To skip this step in future, run: npm install pkg-a@latest pkg-b@latest`,
      ]) {
        expect(logsString.includes(line), logsString).toBe(true)
      }
    })

    test(`Should install one package if the other is already present`, async () => {
      const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
      const basePath = getBasePath(npxDirectoryHash)

      let importCalls = 0
      const logs = []

      const imported = await npxImport(['pkg-a', 'pkg-b@1.2.3'], {
        logger: {
          log: Array.prototype.push.bind(logs),
        },
        onlyPackageRunner: false,
        import: async (name) => {
          ++importCalls
          if (name === 'pkg-a') {
            return { name: 'pkg-a', foo: 1, local: true }
          }
          if (name === 'pkg-b') {
            throw new Error('not-found')
          }
          throw new Error(`Unexpected import call with name: ${name}`)
        },
        importRelative: async (base, sub) => {
          if (base === basePath && sub === 'pkg-b') {
            return { name: 'pkg-b', bar: 2, local: false }
          }
          if (base === basePath && sub === 'pkg-a') {
            return { name: 'pkg-a', foo: 1, local: true }
          }
          throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
        },
        exec: (command, options, cb) => {
          if (command === 'npx --version') {
            cb(null, '8.1.2')
            return
          } else if (command === `npx --prefer-offline -y -p pkg-b@1.2.3 ${printPathCmd}`) {
            cb(null, getNpxPath(npxDirectoryHash))
            return
          }
          cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
          return
        },
      })

      expect(importCalls).toBe(2)

      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1, local: true },
        { name: 'pkg-b', bar: 2, local: false },
      ])

      const logsString = logs.join('\n')

      for (const line of [
        `pkg-b not available locally. Attempting to use npx to install temporarily.`,
        `Installing... (npx --prefer-offline -y -p pkg-b@1.2.3)`,
        `Installed into ${basePath}.`,
        `To skip this step in future, run: npm install pkg-b@1.2.3`,
      ]) {
        expect(logsString.includes(line), logsString).toBe(true)
      }
    })

    test(`Should escape versions to be path-safe`, async () => {
      const npxDirectoryHash = crypto.randomBytes(12).toString('hex')
      const basePath = getBasePath(npxDirectoryHash)

      let importCalls = 0
      const logs = []

      const imported = await npxImport(['pkg-a@>1.0.0', 'pkg-b@*'], {
        logger: {
          log: Array.prototype.push.bind(logs),
        },
        onlyPackageRunner: false,
        import: async (name) => {
          ++importCalls
          throw new Error('not-found')
        },
        importRelative: async (base, sub) => {
          if (base === basePath && sub === 'pkg-a') {
            return { name: 'pkg-a', foo: 1 }
          } else if (base === basePath && sub === 'pkg-b') {
            return { name: 'pkg-b', bar: 2 }
          }
          throw new Error(`Unexpected importRelative call with base: ${base}, sub: ${sub}`)
        },
        exec: (command, options, cb) => {
          if (command === 'npx --version') {
            cb(null, '8.1.2')
            return
          } else if (
            command === `npx --prefer-online -y -p 'pkg-a@>1.0.0' -p 'pkg-b@*' ${printPathCmd}`
          ) {
            cb(null, getNpxPath(npxDirectoryHash))
            return
          }
          cb(new Error(`Unexpected exec call with args: ${[command, options].join(' ')}`))
          return
        },
      })

      expect(importCalls).toBe(2)

      expect(imported).toStrictEqual([
        { name: 'pkg-a', foo: 1 },
        { name: 'pkg-b', bar: 2 },
      ])

      const logsString = logs.join('\n')

      for (const line of [
        `Packages pkg-a, pkg-b not available locally. Attempting to use npx to install temporarily.`,
        `Installing... (npx --prefer-online -y -p 'pkg-a@>1.0.0' -p 'pkg-b@*')`,
        `Installed into ${basePath}.`,
        `To skip this step in future, run: npm install 'pkg-a@>1.0.0' 'pkg-b@*'`,
      ]) {
        expect(logsString.includes(line), logsString).toBe(true)
      }
    })
  })
})
