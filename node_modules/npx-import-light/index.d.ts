/**
 * Imports a package using npx, checking if it is available locally first.
 *
 * @template [T=any]
 * @overload
 * @param {string[]} pkg - The package name(s) to import, e.g. 'left-pad', '@scope/pkg' or an array of such strings.
 * @param {Options} [options] - Options for the import process.
 * @returns {Promise<T[]>} - A promise that resolves to the imported package(s). If multiple package names are given, resolves to an array of results.
 */
export function npxImport<T = any>(pkg: string[], options?: Options): Promise<T[]>
/**
 * @template [T=any]
 * @overload
 * @param {string} pkg
 * @param {Options} [options]
 * @returns {Promise<T>}
 */
export function npxImport<T = any>(pkg: string, options?: Options): Promise<T>
/**
 * Resolves the path of a package that has been imported using npx.
 * If the package was installed locally, it resolves to the local path.
 * If the package was installed temporarily, it resolves to the temporary install directory.
 *
 * @param {string} pkg - The package name to resolve, e.g. 'left-pad' or '@scope/pkg'.
 * @param {Pick<Options, 'resolve' | 'resolveRelative'>} [options] - Options for resolving the package path.
 * @returns {string} - The resolved path of the package.
 */
export function npxResolve(
  pkg: string,
  options?: Pick<Options, 'resolve' | 'resolveRelative'>,
): string
export type Options = {
  /**
   * If true, only import the package if it is running in an npx or bunx context.
   */
  onlyPackageRunner?: boolean
  /**
   * A logger function to use for logging messages.
   */
  logger?: {
    log: (message?: any, ...optionalParams: any[]) => void
  }
  /**
   * A function to import a package by its name.
   */
  import?: (packageWithPath: string) => Promise<any>
  /**
   * A function to import a package relative to a directory.
   */
  importRelative?: (installDir: string, packageWithPath: string) => Promise<any>
  /**
   * A function to resolve a package by its name.
   */
  resolve?: (packageWithPath: string) => string
  /**
   * A function to resolve a package relative to a directory.
   */
  resolveRelative?: (installDir: string, packageWithPath: string) => string
  /**
   * A function to execute a command synchronously.
   */
  exec?: (
    path: string,
    options: Record<string, string | boolean>,
    cb: (err: null | Error, stdout?: string, stderr?: string) => void,
  ) => void
}
export type Package = {
  /**
   * The name of the package.
   */
  name: string
  /**
   * The scope of the package, if any.
   */
  scope: string
  /**
   * The package name without scope.
   */
  packageName: string
  /**
   * The path of the package, if any.
   */
  path: string
  /**
   * The package name with its path.
   */
  nameWithPath: string
  /**
   * The version of the package.
   */
  version: string
  /**
   * The package name formatted for CLI usage, e.g. 'package@1.0.0'.
   */
  cli: string
  /**
   * The raw package string as passed to npxImport.
   */
  raw: string
  /**
   * The imported package, or MISSING if it could not be imported.
   */
  imported: any
}
export type InternalOptions = Required<Omit<Options, 'exec'>> &
  Record<'exec', (cmd: string, options?: Record<string, any>) => Promise<string>>
