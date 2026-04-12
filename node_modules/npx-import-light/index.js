import { exec } from 'node:child_process'
import { builtinModules, createRequire } from 'node:module'
import { platform as osPlatform } from 'node:os'
import { resolve as pathResolve } from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * @typedef {object} Options
 * @property {boolean} [onlyPackageRunner=true] If true, only import the package if it is running in an npx or bunx context.
 * @property {{log: (message?: any, ...optionalParams: any[]) => void}} [logger] A logger function to use for logging messages.
 * @property {(packageWithPath:string) => Promise<any>} [import] A function to import a package by its name.
 * @property {(installDir: string, packageWithPath:string) => Promise<any>} [importRelative] A function to import a package relative to a directory.
 * @property {(packageWithPath:string) => string} [resolve] A function to resolve a package by its name.
 * @property {(installDir: string, packageWithPath:string) => string} [resolveRelative] A function to resolve a package relative to a directory.
 * @property {(path: string, options: Record<string, string|boolean>, cb: ((err: null| Error, stdout?: string, stderr?: string) => void)) => void} [exec] A function to execute a command synchronously.
 */

/**
 * @typedef {object} Package
 * @property {string} name The name of the package.
 * @property {string} scope The scope of the package, if any.
 * @property {string} packageName The package name without scope.
 * @property {string} path The path of the package, if any.
 * @property {string} nameWithPath The package name with its path.
 * @property {string} version The version of the package.
 * @property {string} cli The package name formatted for CLI usage, e.g. 'package@1.0.0'.
 * @property {string} raw The raw package string as passed to npxImport.
 * @property {any} imported The imported package, or MISSING if it could not be imported.
 */

/** @typedef {Required<Omit<Options, 'exec'>>&Record<'exec', (cmd: string, options?: Record<string, any>) => Promise<string>>} InternalOptions */

/**
 * WrappedExec function that executes a command and returns a promise.
 *
 * @param {Options['exec']} exec
 * @returns {(cmd: string, options?: Record<'windowsHide', boolean>) => Promise<string>}
 */
function wrapExec(exec) {
  return (cmd, options) =>
    new Promise((resolve, reject) => {
      exec(cmd, { windowsHide: true, ...options }, (err, stdout, stderr) => {
        err
          ? reject(new Error(`Failed executing '${cmd}': ${stderr || err.message}`))
          : resolve(stdout.trim())
      })
    })
}

const INSTALLED_LOCALLY = Symbol()

/** @type {Record<string, string | typeof INSTALLED_LOCALLY>} */
const INSTALL_CACHE = { __proto__: null }

/** The command to emit the PATH environment variable. */
const emitPath = osPlatform() === 'win32' ? `set PATH` : `printenv PATH`

const isTempPath = RegExp.prototype.test.bind(
  osPlatform() === 'win32' ? /\\npm[-\\]+cache\\_npx\\/ : /\/\.npm\/_npx\//,
)

const splitPathEnvVar =
  osPlatform() === 'win32'
    ? (path) =>
        path
          .replace(/^PATH=/i, '')
          .replace(/\\\\\\\\/g, '\\\\')
          .replace(/\\r\\n/g, ';')
          .split(';')
    : (path) => path.split(':')

/**
 * @param {string} stdout The output from the npx command.
 * @returns {string} The path to the temporary install directory.
 * @throws {Error} If the temporary install directory cannot be found.
 */
const getTempPath = (stdout) => {
  const paths = splitPathEnvVar(stdout)
  const tempPath = paths.find(isTempPath)

  if (!tempPath)
    throw new Error(`Failed to find temporary install directory in:\n${JSON.stringify(paths)}`)
  return tempPath
}

/**
 * @param {string} packageWithPath
 * @returns {Promise<any>}
 */
async function _import(packageWithPath) {
  return await import(packageWithPath)
}

/**
 * @param {string} installDir
 * @param {string} packageWithPath
 * @returns {Promise<any>}
 */
async function _importRelative(installDir, packageWithPath) {
  return await import(pathToFileURL(_resolveRelative(installDir, packageWithPath)).href)
}

/**
 * @param {string} packageWithPath
 * @returns {string}
 */
function _resolve(packageWithPath) {
  return createRequire(import.meta.url).resolve(packageWithPath)
}

/**
 * @param {string} installDir
 * @param {string} packageWithPath
 * @returns {string}
 */
function _resolveRelative(installDir, packageWithPath) {
  return createRequire(pathToFileURL(installDir).href).resolve(packageWithPath)
}

/**
 * Default logger function that logs messages to the console.
 * If the environment variable NPX_IMPORT_QUIET is set, it does nothing.
 * @type {Options['logger']}
 */
const _logger = { log: (message) => console.log(`[NPXI] ${message}`) }

/**
 * Imports a package using npx, checking if it is available locally first.
 *
 * @template [T=any]
 * @overload
 * @param {string[]} pkg - The package name(s) to import, e.g. 'left-pad', '@scope/pkg' or an array of such strings.
 * @param {Options} [options] - Options for the import process.
 * @returns {Promise<T[]>} - A promise that resolves to the imported package(s). If multiple package names are given, resolves to an array of results.
 */

/**
 * @template [T=any]
 * @overload
 * @param {string} pkg
 * @param {Options} [options]
 * @returns {Promise<T>}
 */

/**
 * Imports a package using npx, checking if it is available locally first.
 *
 * @param {string|string[]} pkg - The package name(s) to import, e.g. 'left-pad', '@scope/pkg' or an array of such strings.
 * @param {Options} [options] - Options for the import process.
 * @returns {Promise<T|T[]>} - A promise that resolves to the imported package(s). If multiple package names are given, resolves to an array of results.
 */
export async function npxImport(pkg, options = {}) {
  /** @type {InternalOptions} */
  const opts = {
    logger: _logger,
    import: _import,
    importRelative: _importRelative,
    resolve: _resolve,
    resolveRelative: _resolveRelative,
    onlyPackageRunner: true,
    ...options,
    exec: wrapExec(options.exec || exec),
  }

  const packages = await processPackageParameter(pkg)

  if (opts.onlyPackageRunner === true && isRunningInPackageRunner() === false) {
    // If you pass in an array, you get an array back.
    return Array.isArray(pkg)
      ? Promise.all(packages.map((p) => opts.import(p.nameWithPath)))
      : opts.import(packages[0].nameWithPath)
  }

  const missingPackages = []

  // Check if the package is already installed locally
  for (const p of packages) {
    try {
      p.imported = await opts.import(p.nameWithPath)

      // Mark as installed locally
      INSTALL_CACHE[p.name] = INSTALLED_LOCALLY
    } catch (e) {
      missingPackages.push(p)
    }
  }

  if (missingPackages.length !== 0) {
    await checkNpxVersion(opts)

    opts.logger.log(
      `Package${missingPackages.length === 1 ? '' : 's'} ${missingPackages
        .map((p) => p.nameWithPath)
        .join(', ')} not available locally. Attempting to use npx to install temporarily.`,
    )

    try {
      const installDir = await installPackage(missingPackages, opts)
      for (const pkg of missingPackages) {
        pkg.imported = await opts.importRelative(installDir, pkg.nameWithPath)
        INSTALL_CACHE[pkg.name] = installDir
      }
    } catch (e) {
      throw new Error(
        `import failed for ${missingPackages
          .map((p) => p.nameWithPath)
          .join(',')} with message:\n    ${e.message}\n\n` +
          `You should install ${missingPackages.map((p) => p.name).join(', ')} locally: \n    ` +
          `npm install ${missingPackages.map((p) => p.cli).join(' ')}` +
          `\n\n`,
        { cause: e },
      )
    }
  }

  return Array.isArray(pkg) ? packages.map((p) => p.imported) : packages[0].imported
}

/**
 * Resolves the path of a package that has been imported using npx.
 * If the package was installed locally, it resolves to the local path.
 * If the package was installed temporarily, it resolves to the temporary install directory.
 *
 * @param {string} pkg - The package name to resolve, e.g. 'left-pad' or '@scope/pkg'.
 * @param {Pick<Options, 'resolve' | 'resolveRelative'>} [options] - Options for resolving the package path.
 * @returns {string} - The resolved path of the package.
 */
export function npxResolve(pkg, options = {}) {
  if (typeof pkg !== 'string') {
    throw new TypeError(`can't resolve invalid package name`)
  }

  const { name, nameWithPath } = parsePackage(pkg)

  /** @type {Required<Pick<Options, 'resolve' | 'resolveRelative'>>} */
  const opts = {
    resolve: _resolve,
    resolveRelative: _resolveRelative,
    ...options,
  }

  const cachedDir = INSTALL_CACHE[name]
  if (!cachedDir) {
    throw new Error(`You must call import for the package '${pkg}' before calling resolve`)
  } else if (cachedDir === INSTALLED_LOCALLY) {
    return opts.resolve(nameWithPath)
  } else {
    return opts.resolveRelative(cachedDir, nameWithPath)
  }
}

/**
 * @param {string|string[]} pkg
 * @returns {Promise<Package[]>}
 */
async function processPackageParameter(pkg) {
  if (
    (typeof pkg !== 'string' && !Array.isArray(pkg)) ||
    (Array.isArray(pkg) && pkg.length === 0) ||
    (Array.isArray(pkg) && pkg.some((p) => typeof p !== 'string'))
  ) {
    throw new TypeError(`can't import invalid package name: parsed name '${pkg}' from '${pkg}'`)
  }

  /** @type {string[]} */
  const packageNames = []

  /** @type {Package[]} */
  const packages = []
  for (const p of Array.isArray(pkg) ? pkg : [pkg]) {
    const { raw, scope, name, packageName, nameWithPath, version, cli, path } = parsePackage(p)
    if (packageNames.includes(name)) {
      throw new Error(
        `cannot import the same package twice! Got: '${p}' but already saw '${name}' earlier!`,
      )
    }

    packageNames.push(name)

    packages.push({
      cli,
      name,
      nameWithPath,
      packageName,
      path,
      raw,
      scope,
      version,
      imported: null,
    })
  }

  return packages
}

const semverRE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/u
const isValidSemver = RegExp.prototype.test.bind(semverRE)
const cliEscapeCharsRE = /[<>*]/u
const packageWithVersionRE =
  /^((?:(?:@([a-z0-9-][a-z0-9-_.]*))\/)?([a-z0-9-][a-z0-9-_.]+))(?:@([^/]+))?(\/.*)?$/u

/**
 * @param {string} pkg
 * @returns {Pick<Package, 'raw' | 'scope' | 'name' | 'packageName' | 'path' | 'version' | 'nameWithPath' | 'cli'>}
 */
function parsePackage(pkg) {
  if (pkg[0] === '.' || pkg[0] === '/') {
    throw new Error(`cannot import relative paths: got '${pkg}'`)
  }

  const [
    match = null,
    name,
    scope = '',
    packageName,
    version = 'latest', // Default to 'latest' if no version is specified
    path = '',
  ] = packageWithVersionRE.exec(pkg) || []

  if (match === null) {
    throw new TypeError(`can't import invalid package name: parsed name '${pkg}' from '${pkg}'`)
  }

  const nameWithPath = `${name}${path}`
  const cli = cliEscapeCharsRE.test(version) ? `'${name}@${version}'` : `${name}@${version}`

  if (name.length === 0 || name.length > 214 || name === 'favicon.ico' || name === 'node_modules') {
    throw new TypeError(`can't import invalid package name: parsed name '${name}' from '${pkg}'`)
  }

  // core module names like http, events, util, etc
  if (builtinModules.includes(name)) {
    throw new TypeError(`can only import NPM packages, got core module '${name}' from '${pkg}'`)
  }

  return {
    cli,
    name,
    nameWithPath,
    packageName,
    path,
    raw: pkg,
    scope,
    version,
  }
}

/**
 * @param {Pick<InternalOptions, 'exec'>} opts
 * @throws {Error} If the npx version is less than 7 or if npx cannot be executed.
 * @returns {Promise<void>}
 */
async function checkNpxVersion(opts) {
  let npmVersion
  try {
    npmVersion = await opts.exec(`npx --version`)
  } catch (e) {
    throw new Error(`Couldn't execute 'npx --version'. Is npm installed and up-to-date?`, {
      cause: e,
    })
  }

  if (npmVersion === null || Number(semverRE.exec(npmVersion)?.[1]) < 7) {
    throw new Error(`Require npm version 7+. Got '${npmVersion}' when running 'npx --version'`)
  }
}

/**
 * @param {Package[]} packages
 * @param {Pick<InternalOptions, 'exec' | 'logger'>} opts
 * @returns {Promise<string>} - The path to the temporary install directory.
 */
async function installPackage(packages, opts) {
  const preference = packages.every((p) => isValidSemver(p.version)) ? 'offline' : 'online'
  const installPackage = `npx --prefer-${preference} -y ${packages
    .map((p) => `-p ${p.cli}`)
    .join(' ')}`
  opts.logger.log(`Installing... (${installPackage})`)

  /** @type {string} */
  let tempPathResult
  try {
    tempPathResult = await opts.exec(`${installPackage} ${emitPath}`)
  } catch (e) {
    throw new Error(
      `Failed installing ${packages.map((p) => `'${p.name}'`).join(',')} using: ${installPackage}.`,
      { cause: e },
    )
  }
  const tempPath = getTempPath(tempPathResult)

  // Expecting the path ends with node_modules/.bin
  const nodeModulesPath = pathResolve(tempPath, '..')
  if (!nodeModulesPath.endsWith('node_modules')) {
    throw new Error(
      `Found NPX temporary path of '${tempPath}' but expected to be able to find a node_modules directory by looking in '..'.`,
    )
  }

  opts.logger.log(
    `Installed into ${nodeModulesPath}.`,
    `To skip this step in future, run: npm install ${packages.map((p) => p.cli).join(' ')}`,
  )

  return nodeModulesPath
}

/**
 * @returns {boolean}
 */
function isRunningInPackageRunner() {
  return process.env.npm_lifecycle_event === 'npx' || process.env.npm_lifecycle_event === 'bunx'
}
