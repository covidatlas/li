/* Hacky hacky */

const fs = require('fs')
const path = require('path')
const is = require('is')

// Utils /////////////////////////////////////

function makeLiScraper (cdsScraper, startDate) {
  const getBody = (string) => string.substring(
    string.indexOf("{") + 1,
    string.lastIndexOf("}")
  )
  const body = getBody(cdsScraper.toString())

  // Each call to 'fetch' is a new crawl.
  const crawlRe = /fetch\.(.*?)\(.*?, (.*?), '(.*?)'/g
  const crawlMatches = []
  let match = crawlRe.exec(body)
  while(match !== null ) {
    crawlMatches.push(match)
    match = crawlRe.exec(body)
  }

  const crawl = crawlMatches.map(cm => {
    let type = cm[1]
    if (type === 'fetch')
      type = 'raw'

    const hsh = {
      type: type,
      url: cm[2]
    }
    if (cm[3] !== 'default')
      hsh.name = cm[3]
    return hsh
  })

  const s = {
    startDate: startDate,
    crawl,
    scrape: new Function('data, date, helpers', '/* TODO uncomment + fix! \n' + body + '\n */')
  }
  return s
}


// Stringize a js object, including functions.
function stringize (obj, level = 0) {

  const indent = () => { return ' '.repeat(level * 2) }

  if (is.string(obj)) {
    return "'" + obj.replace(/\'/, "\'" + "'") + "',"
  }
  if (is.number(obj)) {
    return obj + ','
  }
  if (is.array(obj)) {
    let ret = []
    ret.push('[')
    level += 1
    ret = ret.concat(obj.map(o => stringize(o, level)))
    level -= 1
    ret.push(indent() + '],')
    return ret.join('\n')
  }
  if (is.hash(obj)) {
    let ret = []
    ret.push(indent() + '{')
    level += 1
    for (const k of Object.keys(obj)) {
      ret.push(indent() + k + ': ' + stringize(obj[k], level))
    }
    level -= 1
    ret.push(indent() + '},')
    return ret.join('\n')
  }
  return obj
}

////////////////////////////////////////////////////
// Main

// Things to fix, printed at the end.
const todos = []

const fname = process.argv[2]
if (!fs.existsSync(fname)) {
  console.log(`No file ${fname}, quitting.`)
  process.exit(0)
}

let rawcontent = fs.readFileSync(fname, 'utf-8')

// If there were any local imports, get those, and todo those files.
const localImportsRe = /^import.*?from '\.\/.*?;$/gm
const localImportMatches = []
let match = localImportsRe.exec(rawcontent)
while(match !== null) {
  localImportMatches.push(match[0])
  match = localImportsRe.exec(rawcontent)
}

// Start hacking away at content until it evals successfully locally.
let content = rawcontent.replace(/^import.*;$/gmi, '')
content = content.replace('export default scraper;', '')
content = content.replace(/^\s*[\r\n]/gm, '')
content = content.replace('const scraper =', 'module.exports =')

const requires = `
const srcShared = '../src/shared/'
// const assert = require('assert')
const constants = require(srcShared + 'sources/_lib/constants.js')
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const sorter = require(srcShared + 'utils/sorter.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
// const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')
const { join, sep } = require('path')
// const usStates = require('./us-states.json')
// const glob = require('glob').sync
// const globJoin = require('../../utils/glob-join.js')
// const gssCodeMap = require('../_shared.js')
// const gssCodes = require('./gss-codes.json')
// const latinizationMap = require('./latinization-map.json')
`
todos.push('delete unused requires')

const source = eval(requires + content)

if (source.sources) {
  if (source.sources.length > 1)
    todos.push('multiple sources listed, only taking first, please verify')
  source.friendly = source.sources[0]
  delete source.sources
}

const { url, type, data } = source
if (url) {
  todos.push('fyi deleted source.url, value = ' + source.url)
  delete source.url
}
if (type) {
  todos.push('fyi deleted source.type, value = ' + source.type)
  delete source.type
}
if (data) {
  todos.push('fyi deleted source.data, value = ' + source.data)
  delete source.data
}

// Make Li scrapers
const finalScrapers = []
if (is.function(source.scraper)) {
  // this is a single-func only thing
  todos.push('fix 1999-09-09 start date')
  finalScrapers.push(makeLiScraper(source.scraper, '1999-09-09'))
  todos.push('fix 1999-09-09 scrape and crawl')
} else if (is.object(source.scraper)) {
  // keys are the dates
  Object.keys(source.scraper).forEach(k => {
    if (k === '0') {
      todos.push('fix 0 start date')
    }
    finalScrapers.push(makeLiScraper(source.scraper[k], k))
    todos.push('fix ' + k + ' scrape and crawl')
  })
} else {
  todos.push('fix busted scraper thing ??? Not sure what this is ...')
}

// Remove CDS, add Li scrapers
delete source.scraper
source.scrapers = finalScrapers


// Print ////////////////////////////////////////

// New file newcontent
const newcontent = []

const sepAt = 'src/shared/scrapers/'
const shortfname = sepAt + fname.split(sepAt)[1]
newcontent.push(`// Migrated from coronadatascraper, ${shortfname}\n`)

const fileDepth = fname.split(sepAt)[1].split('/').length

// Dump some common headers.
// Hacking src/shared so that the gen'd file has the right rel path for src/shared.
// Yep, hacky hacky.
const newSrc = requires.replace("const srcShared = '../src/shared/'", `const srcShared = '${'../'.repeat(fileDepth)}'`)
newcontent.push(newSrc)

if (localImportMatches.length > 0) {
  todos.push('fix local imports')
  localImportMatches.map(s => newcontent.push(s))
  newcontent.push('')
}

let output = 'module.exports = ' + stringize(source)

if (output.includes('maintainers'))
  todos.push('"normalize" maintainers (replace with references, sorry :-) )')

output = output.replace(/scrape: function anonymous\(data, date, helpers\n\) \{/gm, 'scrape (data, date, helpers) {')
newcontent.push(output)

newcontent.push('\n')
todos.map(s => '// TODO: ' + s).map(s => newcontent.push(s))



const outfile = process.argv[3]
if (outfile === null || outfile === undefined) {
  console.log(newcontent.join('\n'))
  process.exit(0)
}

const fullPath = path.join(process.cwd(), 'src', 'shared', 'sources', ...outfile.split(path.sep))
const parts = fullPath.split(path.sep)
const filename = parts[parts.length - 1]
const dirname = parts.slice(0, parts.length - 1).join(path.sep)

console.log('Writing ' + filename + ' to ' + dirname)

if (!fs.existsSync(dirname))
  fs.mkdirSync(dirname, { recursive: true })

if (fs.existsSync(fullPath)) {
  console.log(`File ${outfile} already exists, quitting ...`)
  process.exit(0)
}

fs.writeFileSync(fullPath, newcontent.map(s => s.replace(/;$/, '')).join('\n'))
