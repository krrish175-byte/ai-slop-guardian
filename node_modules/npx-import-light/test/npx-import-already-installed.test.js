import { randomBytes } from 'node:crypto'
import { describe, expect, test } from './testrunner.js'
import { npxImport } from '../index.js'

describe(`npxImport`, () => {
  describe('already installed', () => {
    test(`should call import() and return it`, async () => {
      let testId = randomBytes(6).toString('hex')
      const result = await npxImport('fake-library', {
        import: async (name) => {
          expect(name).toBe('fake-library')
          return {
            fake: testId,
          }
        },
      })
      expect(result.fake).toBe(testId)

      testId = randomBytes(6).toString('hex')
      const scopedResult = await npxImport('@fake/library', {
        import: async (name) => {
          expect(name).toBe('@fake/library')
          return {
            fake: testId,
          }
        },
      })
      expect(scopedResult.fake).toBe(testId)
    })

    test(`should ignore versions when trying to import locally (for now)`, async () => {
      let testId = randomBytes(6).toString('hex')

      const result = await npxImport('fake-library@1.2.3', {
        import: async (name) => {
          expect(name).toBe('fake-library')
          return {
            fake: testId,
          }
        },
      })
      expect(result.fake).toBe(testId)

      testId = randomBytes(6).toString('hex')

      const scopedResult = await npxImport('@fake/library@1.2.3', {
        import: async (name) => {
          expect(name).toBe('@fake/library')
          return {
            fake: testId,
          }
        },
      })

      expect(scopedResult.fake).toBe(testId)
    })

    test(`should ignore tags when trying to import locally`, async () => {
      let testId = randomBytes(6).toString('hex')

      const result = await npxImport('fake-library@beta', {
        import: async (name) => {
          expect(name).toBe('fake-library')
          return {
            fake: testId,
          }
        },
      })
      expect(result.fake).toBe(testId)

      testId = randomBytes(6).toString('hex')
      const scopedResult = await npxImport('@fake/library@beta', {
        import: async (name) => {
          expect(name).toBe('@fake/library')
          return {
            fake: testId,
          }
        },
      })

      expect(scopedResult.fake).toBe(testId)
    })

    test(`should pass through paths`, async () => {
      let testId = randomBytes(6).toString('hex')

      const result = await npxImport('fake-library/lib/utils.js', {
        import: async (name) => {
          expect(name).toBe('fake-library/lib/utils.js')
          return {
            fake: testId,
          }
        },
      })
      expect(result.fake).toBe(testId)

      testId = randomBytes(6).toString('hex')
      const scopedResult = await npxImport('@fake/library/lib/utils.js', {
        import: async (name) => {
          expect(name).toBe('@fake/library/lib/utils.js')
          return {
            fake: testId,
          }
        },
      })

      expect(scopedResult.fake).toBe(testId)
    })

    test(`should work with versions and paths`, async () => {
      let testId = randomBytes(6).toString('hex')

      const result = await npxImport('fake-library@1.2.3/lib/utils.js', {
        import: async (name) => {
          expect(name).toBe('fake-library/lib/utils.js')
          return {
            fake: testId,
          }
        },
      })
      expect(result.fake).toBe(testId)

      testId = randomBytes(6).toString('hex')
      const scopedResult = await npxImport('@fake/library@1.2.3/lib/utils.js', {
        import: async (name) => {
          expect(name).toBe('@fake/library/lib/utils.js')
          return {
            fake: testId,
          }
        },
      })

      expect(scopedResult.fake).toBe(testId)
    })
  })
})
