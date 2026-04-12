import { npxImport } from '../index.js'

const reset = '\x1b[0m'
const gray = '\x1b[90m'
const green = '\x1b[32m'

console.log(`${green}❯${reset} node ./index.js --filename=image.png\n`)

try {
  // @ts-expect-error
  await import('cowsay')
  console.error(`${gray}Package cowsay is already installed, skipping installation.${reset}`)
} catch (e) {
  console.debug(`Package cowsay is not installed, installing it now...`)
  const cowsay = await npxImport('cowsay', {
    logger: { log: (log) => console.debug('  ' + gray + log + reset) },
    onlyPackageRunner: false,
  })

  console.log(
    cowsay.say({
      text: 'Hello from cowsay!',
    }),
  )
}
