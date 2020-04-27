/** Report migration status of sources. */

const glob = require('glob')
const path = require('path')
const fs = require('fs')
const lib = path.join(__dirname, '..', 'src', 'shared', 'sources', '_lib')
const sourceKey = require(path.join(lib, 'source-key.js'))
const sourceMap = require(path.join(lib, 'source-map.js'))
const { execSync } = require('child_process')


function printWarning (s) {
  console.log()
  console.log('************************************************************')
  console.log(s)
  console.log('************************************************************')
  console.log()
}

function parsecommit (raw) {
  const lines = raw.split('\n')
  return {
    sha: lines[0].replace('commit ', ''),
    auth: lines[1].replace('Author: ', ''),
    date: lines[2].replace('Date:   ', ''),
    message: lines[4].trim()
  }
}

function runGitCommand (command, basepath) {
  let raw = ''
  try {
    raw = execSync(command, { encoding: 'utf-8' })
  } catch (err) {
    const warning = `This script requires an updated remote named "upstream"
to get git diff information.
Please add a remote named "upstream" in ${basepath},
and in that same repo, do "git fetch".
(Sorry about that!)`
    printWarning(warning)
    process.exit(1)
  }
  return raw
}

/** Get commit info, keyed by relpaths. */
function getRelPathCommits (basepath, relPaths, remote) {
  console.log(`Getting commits in ${basepath} for ${relPaths.length} files from ${remote}/master ...`)
  const olddir = process.cwd()
  process.chdir(basepath)

  let remotes = runGitCommand('git remote -v', basepath)
  // console.log(remotes)
  const re = new RegExp(remote)
  let upstreams = remotes.split('\n').filter(s => re.test(s))
  if (upstreams.length === 0)
    throw new Error(`missing remote ${remote}`)
  let upstream = upstreams[0].split('\t')[0]

  const result = relPaths.reduce((hsh, relpath) => {
    const cmd = `git log ${upstream}/master -n 1 --date=short -- ${relpath}`
    let raw = runGitCommand(cmd, basepath)
    return {
      ...hsh,
      [relpath]: parsecommit(raw)
    }
  }, {})

  process.chdir(olddir)
  console.log(`... done.`)
  return result
}

function getRptDataFor (arr, commitmap) {
  return arr.reduce((acc, fname) => {
    const key = sourceKey(fname).toLowerCase()
    const rpath = fname.replace(/.*shared.sources./, '')
    const commit = commitmap[rpath]
    return {
      ...acc,
      [key]: {
        relpath: rpath,
        commitsha: commit.sha,
        commitauth: commit.auth,
        commitdate: commit.date,
        commitmessage: commit.message
      }
    }
  }, {})
}

/** Given array of hashes, create a function that pads elements appropriately
 * for output.
 */
function makePaddedStringFunc (arrOfHashes, outputKeyArray, spaces = 1) {
  const mapKeyMaxLength = Object.keys(output[0]).reduce((hsh, k) => {
    const maxLength = Math.max(...output.map(e => e[k].length))
    return { ...hsh, [k]: maxLength }
  }, {})

  return function (hsh) {
    return outputKeyArray.map(k => {
      let curr = hsh[k]
      let n = mapKeyMaxLength[k] - curr.length + spaces
      if (n < 0) n = 0
      return curr + ' '.repeat(n)
    }).join(' ')
  }
}

/////////////////////////////////////////////////////////
// Entry point

// ---------------------
// CDS scrapers

const cdsscraperdir = path.join(__dirname, '..', '..', 'coronadatascraper', 'src', 'shared', 'scrapers')
if (!fs.existsSync(cdsscraperdir)) {
  const warning = `Missing CDS project dir
${cdsscraperdir}
For this script, the CDS repo must be checked out
in ${process.cwd().replace(/[\/]li[\/]$/, '')}.`
  printWarning(warning)
  process.exit(1)
}

const pattern = path.join(cdsscraperdir, '**', '*.js')
const options = {
  ignore: [ path.join('**', '_*.js'), path.join('**', '_*', '*.js') ]
}
let matches = []
glob.sync(pattern, options).forEach(fname => { matches.push(fname) })

matches = matches.map(m => {
  // HACK - sourceKey splits at "shared/sources" in li,
  // so hack the filepaths in coronadatascraper so we can re-use the function.
  // This makes this code ugly, but I don't care, it's temporary.
  const rep = path.join('shared', 'sources')
  return m.replace(/shared.scrapers/, rep)
})

const cdsRelPaths = matches.map(f => f.replace(/.*shared.sources./, ''))
const lastCommitMap = getRelPathCommits(cdsscraperdir, cdsRelPaths, 'covidatlas/coronadatascraper.git')
const cdsmap = getRptDataFor(matches, lastCommitMap)

// ---------------------
// Li sources

const libase = path.join(__dirname, '..', 'src', 'shared', 'sources')
const lirels = Object.values(sourceMap()).map(s => s.replace(/.*shared.sources./, ''))
const liCommitMap = getRelPathCommits(libase, lirels, 'covidatlas/li.git')
const limap = getRptDataFor(Object.values(sourceMap()), liCommitMap)

// ---------------------
// Combine and output

const output = Object.keys(cdsmap).reduce((arr, k) => {
  let uptodate = '-'
  if (limap[k]) {
    if (limap[k].commitdate > cdsmap[k].commitdate)
      uptodate = 'yes'
    else
      uptodate = 'no'
  }
  arr.push( {
    key: k,
    cds: cdsmap[k].relpath,
    li: limap[k] ? 'yes' : 'no',
    uptodate: uptodate
  } )
  return arr
}, [])

const padElements = makePaddedStringFunc(output, [ 'key', 'cds', 'li', 'uptodate' ])
const writeRows = rows => { rows.map(padElements).forEach(s => console.log(s)) }
const writeData = (heading, rows) => {
  const s = `${heading} (${rows.length})`
  console.log(`\n${s}`)
  console.log('-'.repeat(s.length))
  writeRows(rows)
}

console.log(`\n\n${'='.repeat(40)}\n`)

const headings = [
  { key: 'key', cds: 'CDS path', li: 'li?', uptodate: 'up-to-date?' },
  { key: '---', cds: '--------', li: '---', uptodate: '-----------' },
]

writeRows(headings)
writeData('DONE', output.filter(r => (r.uptodate === 'yes')))
writeData('NEEDS UPDATING', output.filter(r => (r.li === 'yes' && r.uptodate !== 'yes')))
writeData('REMAINING', output.filter(r => (r.li !== 'yes')))
