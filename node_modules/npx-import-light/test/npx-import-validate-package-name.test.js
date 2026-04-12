import { describe, expect, test } from './testrunner.js'
import { npxImport } from '../index.js'

describe('throws error for invalid values', async () => {
  /** @type {any[]} */
  const invalidPackageNames = [123, undefined, null, [], [123]]

  for (const invalidPackageName of invalidPackageNames) {
    test(`"${invalidPackageName}"`, async () => {
      await expect(npxImport(invalidPackageName)).rejects.toThrowError(
        `can't import invalid package name: parsed name '${invalidPackageName}' from '${invalidPackageName}'`,
      )
    })
  }
})

describe('throws error for relative paths', async () => {
  for (const relativePath of [
    './local-dep/index.js',
    '../local-dep/index.js',
    '/local-dep/index.js',
    '.start-with-period',
    '..start-with-period',
    '/start-with-slash',
    './',
    '../',
    './index.js',
    '../index.js',
    './index.mjs',
    '../index.mjs',
    './index.cjs',
    '../index.cjs',
    './index.ts',
    '../index.ts',
  ]) {
    test(`"${relativePath}"`, async () => {
      await expect(npxImport(relativePath)).rejects.toThrowError(
        `cannot import relative paths: got '${relativePath}'`,
      )
      await expect(npxImport([relativePath])).rejects.toThrowError(
        `cannot import relative paths: got '${relativePath}'`,
      )
    })
  }
})

describe('throws error for invalid package names', async () => {
  for (const invalidName of [
    '',
    'crazy!',
    '@npm/',
    '@npm/.',
    '@npm/..',
    '@npm/.package',
    '@npm/..package',
    '_start-with-underscore',
    'contain:colons',
    '@contain:c/olons',
    '@conta/in:colons',
    ' leading-space',
    '  multiple-leading-space',
    'center space',
    'trailing-space ',
    'multiple-trailing-space  ',
    'ifyouwanttogetthesumoftwonumberswherethosetwonumbersarechosenbyfindingthelargestoftwooutofthreenumbersandsquaringthemwhichismultiplyingthembyitselfthenyoushouldinputthreenumbersintothisfunctionanditwilldothatforyou.',
    'CAPITAL-LETTERS',
    'excited!',
    ' leading-space:and:weirdchars',
    '@npm-zors/money!time.js',
  ]) {
    test(`"${invalidName}"`, async () => {
      await expect(npxImport(invalidName)).rejects.toThrowError(
        `can't import invalid package name: parsed name '${invalidName}' from '${invalidName}'`,
      )
      await expect(npxImport([invalidName])).rejects.toThrowError(
        `can't import invalid package name: parsed name '${invalidName}' from '${invalidName}'`,
      )
    })
  }
})

describe('throws error for banned package names', async () => {
  for (const bannedName of ['favicon.ico', 'node_modules']) {
    test(`"${bannedName}"`, async () => {
      await expect(npxImport(bannedName)).rejects.toThrowError(
        `can't import invalid package name: parsed name '${bannedName}' from '${bannedName}'`,
      )
      await expect(npxImport([bannedName])).rejects.toThrowError(
        `can't import invalid package name: parsed name '${bannedName}' from '${bannedName}'`,
      )
    })
  }
})

describe('throws error for core modules', async () => {
  for (const coreModule of ['http', 'process', 'fs']) {
    test(`"${coreModule}"`, async () => {
      await expect(npxImport(coreModule)).rejects.toThrowError(
        `can only import NPM packages, got core module '${coreModule}' from '${coreModule}'`,
      )
      await expect(npxImport([coreModule])).rejects.toThrowError(
        `can only import NPM packages, got core module '${coreModule}' from '${coreModule}'`,
      )
    })
  }
  for (const coreModule of ['fs@latest', 'fs/promises']) {
    test(`"${coreModule}"`, async () => {
      await expect(npxImport(coreModule)).rejects.toThrowError(
        `can only import NPM packages, got core module 'fs' from '${coreModule}'`,
      )
      await expect(npxImport([coreModule])).rejects.toThrowError(
        `can only import NPM packages, got core module 'fs' from '${coreModule}'`,
      )
    })
  }
})
