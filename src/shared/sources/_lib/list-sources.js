/** List all sources. */

const { join, sep } = require('path')
const sourceMap = require('./source-map.js')

const baseDir = join(process.cwd(), 'src', 'shared', 'sources')

const m = sourceMap()
const data = Object.entries(m).
      map(p => {
        return {
          key: p[0],
          path: p[1],
          shortPath: p[1].replace(`${baseDir}${sep}`, '')
        }
      }).
      map(hsh => {
        // eslint-disable-next-line
        const s = require(hsh.path)
        return {
          ...hsh,
          priority: s.priority || '',
          maintainers: (s.maintainers || []).map(m => m.github).join(', ')
        }
      })


const maxLengths = data.reduce((hsh, d) => {
  Object.keys(d).forEach(k => {
    if (hsh[k] === undefined)
      hsh[k] = k.length
    const sl = `${d[k]}`.length
    if (sl > hsh[k]) {
      console.log(`New entry ${d[k]} for key ${k}`)
      hsh[k] = sl
    }
  })
  return hsh
}, {})
// console.table(maxLengths)

function printRow (d) {
  const keys = [ 'key', 'priority', 'shortPath' ]
  const out = keys.map(k => `${d[k]}`.padEnd(maxLengths[k] + 2, ' '))
  console.log(out.join(''))
}

printRow({ key: 'Source ID', shortPath: 'shared/sources', priority: 'priority' })
printRow({ key: '---------', shortPath: '--------------', priority: '--------' })
data.forEach(d => printRow(d))
