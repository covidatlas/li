/** List instances of fixme, todo, etc in js code comments.
 *
 * Entries included should look like this, eg.
 * // FIXME [(<group-name>)] info
 *
 * These are then printed out, grouped by group name, then file.  e.g.,
 *
 *   Group: S3
 *
 *    src/events/crawler/crawl/index.js
 *       FIXME (S3) change to prod url
 *
 *   Group: (none)
 *
 *    src/events/crawler/cache/_write-s3.js
 *       TODO build S3 integration here
 */

const glob = require('glob')
const path = require('path')
const fs = require('fs')

/** Glob always uses forward slash for separator, regardless of OS. */
function globJoin (...args) {
  return path.join(...args).replace(/\\/g, '/')
}

/** Scan file fname for all FIXME/TODO/etc entries. */
function scanFile (fname) {
  const content = fs.readFileSync(fname, 'utf-8')
  const re = /\s+(FIXME|TODO|BUG)\s*(\(.*\))?\s*(.*)/ig
  return [ ...content.matchAll(re) ].map(m => {
    let groupname = m[2] === undefined ? '' : m[2]
    groupname = groupname.replace(/^\(/, '').replace(/\)$/, '')
    if (groupname === '') groupname = '(none)'
    return {
      matchdata: m.join(', '),
      name: fname,
      todo: m[0],
      type: m[1],
      group: groupname,
      rest: m[3]
    }
  })
}

/** Print all to console, grouped by group, then file. */
function printMatches (matches) {
  matches = matches.flat()

  function unique (value, index, self) {
    return self.indexOf(value) === index
  }
  const allGroups = matches.map(m => m.group).sort().filter(unique)

  allGroups.forEach(g => {
    console.log(`\nGroup: ${g}`)
    const matchesForGroup = matches.filter(m => m.group === g)
    const filesInGroup = matchesForGroup.map(m => m.name).sort().filter(unique)
    filesInGroup.forEach(f => {
      console.log(`\n  ${f.replace(process.cwd() + path.sep, '')}`)
      matchesForGroup.filter(m => m.name === f).forEach(m => {
        console.log(`    ${m.todo}`)
      })
    })
  })
  console.log(`\n(${matches.length} matches in ${allGroups.length} groups)\n`)
}

const pattern = globJoin(process.cwd(), '**', '*.js')
const options = {
  ignore: [
    globJoin('**', 'node_modules', '**'),
    globJoin('**', 'tools', '**'),
    globJoin('**', 'tools-migration', '**')
  ]
}
const matches = []
glob.sync(pattern, options).forEach(fname => { matches.push(scanFile(fname)) })

printMatches(matches)


