/** Report migration status of sources. */

const glob = require('glob')
const path = require('path')
const fs = require('fs')
const lib = path.join(__dirname, '..', 'src', 'shared', 'sources', '_lib')
const sourceKey = require(path.join(lib, 'source-key.js'))
const sourceMap = require(path.join(lib, 'source-map.js'))
const { execSync } = require('child_process')

let reportType = 'console'
if (process.argv.includes('console')) {
  reportType = 'console'
} else if (process.argv.includes('report')) {
  reportType = 'report'
} else if (process.argv.includes('summary')) {
  reportType = 'summary'
} else {
  console.log('specify console || report || summary')
  console.log('eg "npm run migration:status -- console"')
  console.log('eg "npm --silent run migration:status -- report | pbcopy"')
  process.exit(0)
}


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
  // console.log(`Getting commits in ${basepath} for ${relPaths.length} files from ${remote}/master ...`)
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
  // console.log(`... done.`)
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

// Some scrapers are really done.
const overrideStatus = {
  'AU/aus-from-wa-health/index.js': 'deprecated',
  'US/CA/alameda-county.js': 'deprecated',
  'US/CA/calaveras-county.js': 'deprecated',
  'US/CA/del-norte-county.js': 'deprecated',
  'US/CA/glenn-county.js': 'deprecated',
  'US/CA/kern-county.js': 'deprecated',
  'US/CA/madera-county.js': 'deprecated',
  'US/CA/marin-county.js': 'deprecated',
  'US/CA/mendocino-county.js': 'deprecated',
  'US/CA/merced-county.js': 'deprecated',
  'US/CA/riverside-county.js': 'deprecated',
  'US/CA/sacramento-county.js': 'deprecated',
  'US/CA/san-bernardino-county.js': 'deprecated',
  'US/CA/santa-barbara-county.js': 'deprecated',
  'US/CA/santa-clara-county.js': 'deprecated',
  'US/CA/santa-cruz-county.js': 'deprecated',
  'US/CA/sonoma-county.js': 'deprecated',
  'US/CA/yolo-county.js': 'deprecated',
  'US/GU/index.js': 'deprecated',

  'IN/index.js': 'done',
  'TW/index.js': 'done'
}

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

  let status = '-'
  if (uptodate === 'yes')
    status = 'done'
  else if (limap[k])
    status = 'needs_updating'
  else
    status = 'remaining'
  status = overrideStatus[cdsmap[k].relpath] || status

  arr.push( {
    cds: cdsmap[k].relpath,
    in_li: limap[k] ? 'yes' : 'no',
    li_key: k,
    up_to_date: uptodate,
    status
  } )

  return arr
}, [])

const padElements = makePaddedStringFunc(output, [ 'cds', 'in_li', 'li_key', 'up_to_date' ])
const writeRows = rows => { rows.map(padElements).forEach(s => console.log(s)) }
const writeData = (heading, rows) => {
  const s = `${heading} (${rows.length})`
  console.log(`\n${s}`)
  console.log('-'.repeat(s.length))
  writeRows(rows)
}

const headings = [
  { li_key: 'key', cds: 'CDS path', in_li: 'li?', up_to_date: 'up-to-date?' },
  { li_key: '---', cds: '--------', in_li: '---', up_to_date: '-----------' },
]

const rpt = [
  'done', 'needs_updating', 'remaining', 'deprecated', '-'
].reduce((hsh, s) => {
  hsh[s] = output.filter(r => (r.status === s))
  return hsh
}, {})

if (reportType === 'console') {
  writeRows(headings)
  Object.keys(rpt).forEach(k => {
    writeData(k, rpt[k])
  })
}

if (reportType === 'summary') {
  console.log('Migration summary:')
  Object.keys(rpt).forEach(k => {
    if (rpt[k].length > 0)
      console.log(`* ${k}: ${rpt[k].length}`)
  })
}

if (reportType === 'report') {
  console.log(Object.keys(output[0]).join('|'))
  output.map(r => console.log(Object.values(r).join('|')))
}
