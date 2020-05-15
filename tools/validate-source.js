const { join } = require('path')
const lib = join(process.cwd(), 'src', 'shared', 'sources', '_lib')
const sourceMap = require(join(lib, 'source-map.js'))
const { validateSource } = require(join(lib, 'validate-source.js'))

// Validating a source via command line.
if (process.argv.length !== 3) {
  console.log('Please pass in a source key to validate.')
  process.exit(0)
}
const key = process.argv[2]

console.log()
const map = sourceMap()
if (map[key] === undefined) {
  console.log(`No source found for source ID ${key}.  Available are:\n`)
  // eslint-disable-next-line
  require(join(lib, 'list-sources.js'))
  console.log()
  process.exit(0)
}

// eslint-disable-next-line
const source = require(map[key])
const result = validateSource(source)

if (result.warnings.length) {
  console.log('Warnings:')
  result.warnings.map(w => console.log('* ' + w))
}
if (result.errors.length) {
  console.log('Errors:')
  result.errors.map(e => console.log('* ' + e))
}
if (result.warnings.length + result.errors.length === 0) {
  console.log(`No errors or warnings for source ${key}!`)
}
console.log()
