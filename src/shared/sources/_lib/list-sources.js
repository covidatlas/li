/** List all sources. */

const { join, sep } = require('path')
const sourceMap = require('./source-map.js')

const m = sourceMap()

const maxKeyLen = Math.max(...Object.keys(m).map(el => el.length))
const baseDir = join(process.cwd(), 'src', 'shared', 'sources')

function paddedKeyEntry (k) {
  const keyPad = ' '.repeat(maxKeyLen - k.length + 1)
  return k + keyPad
}

console.log(`${paddedKeyEntry('Source ID')} shared/sources/`)
console.log(`${paddedKeyEntry('---------')} ---------------`)
for (const [ k, p ] of Object.entries(m)) {
  const kout = paddedKeyEntry(k)
  const pout = p.replace(`${baseDir}${sep}`, '')
  console.log(`${kout} ${pout}`)
}
