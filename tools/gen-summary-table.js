/** Generate a summary file of sources to disk, doing a crawl and scrape.
 *
 * Generates for all sources, unless --source is specified.
 *
 * run with `--help` to get args.
 *
 * The options for this follow the semantics of options in CDS timeseries:
 * - if date present, gen from that date to today
 * - if date and endDate present, gen for range
 *
 * If no date is given, this gens only for today.
 *
 * Sample calls:
 *
 * # For a range of dates, all scrapers, writing to zz-out:
 * $ node tools/gen-raw-files.js --output zz-out --date 2020-05-01 --endDate 2020-05-05
 *
 * # For all dates start at 2020-05-02, single scraper:
 * $ node tools/gen-raw-files.js --output zz-kr-out --source kr --date 2020-05-07
 *
 * # For today, single scraper (also does a crawl for today):
 * $ node tools/gen-raw-files.js --output zz-kr-out --source kr
 *
 */

/** NODE_ENV must be 'testing' to ensure the sandbox is loaded
 * correctly; otherwise, we get 'InvalidAccessKeyId' errors. */
process.env.NODE_ENV = 'testing'

const { join } = require('path')
const fs = require('fs')
const assert = require('assert')
const sandbox = require('@architect/sandbox')

const srcLib = join(process.cwd(), 'src', 'shared', 'sources', '_lib')
const sourceMap = require(join(srcLib, 'source-map.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawlSource = require(join(srcEvents, 'crawler', '_crawl.js'))
const scrape = require(join(srcEvents, 'scraper', '_scrape.js'))

/**
 * Options.
 */
const yargs = require('yargs')

const { argv } = yargs
  .option('date', {
    alias: 'd',
    description: 'Start timeseries at yyyy-mm-dd',
    type: 'string'
  })
  .option('endDate', {
    alias: 'e',
    description: 'End date of timeseries, yyyy-mm-dd',
    type: 'string'
  })
  .option('source', {
    alias: 's',
    description: 'Specific Source ID to include (can specify multiple: -s x -s y -s z)',
    type: 'Array'
  })
  .option('output', {
    alias: 'o',
    description: 'Directory to write raw files to',
    type: 'String'
  })
  .demandOption([ 'output' ], 'Please specify --output')
  .version(false)
  .help()

// Always crawl if we're generating for today.
argv.crawl = (!argv.date) ? true : false

/** Get sources from options, or all. */
function getSourceKeys (options) {
  if(!options.source)
    return Object.keys(sourceMap())

  // Yargs is funny with (potential) array args ...
  if (typeof(options.source) === 'string')
    return [ options.source ]

  // It's an array, just use it.
  return options.source
}

/** Generate a list of dates starting at the provided date
 * ending at today or the provided end date.  If no date is specified,
 * use today. */
function getDates (options) {
  const datepart = d => { return d.toISOString().split('T')[0] }
  const today = new Date()

  if (!options.date) {
    return [ datepart(today) ]
  } else {
    const dates = []
    const endDate = options.endDate ? new Date(options.endDate) : today
    let curDate = new Date(options.date)
    while (curDate <= endDate) {
      dates.push(datepart(curDate))
      curDate.setDate(curDate.getDate() + 1)
    }
    return dates
  }
}


/**
 * Status reporting.
 */

/** The status of data collection. */
let generationStatus = {}

/** The date to show in the heading. */
let generationDate = null

function reportGenerationStatus () {
  const keys = Object.keys(generationStatus)
  if (keys.length === 0)
    return
  const maxLen = Math.max(...keys.map(s => s.length))
  const title = `  Current status for ${generationDate} (${new Date().toLocaleTimeString()})`
  console.log('-'.repeat(title.length))
  console.log(title)
  const statuses = [ 'crawling', 'scraping', 'done', 'failed', 'pending' ]
  statuses.forEach(status => {
    Object.entries(generationStatus).
      filter(e => e[1] === status).
      map(e => console.log(`  ${e[0].padEnd(maxLen + 2, ' ')}: ${e[1]}`))
  })
  console.log('-'.repeat(title.length))
}


/**
 * Loading data.
 */

/** Returns data, or null if there was an error. */
async function scrapeData (sourceID, crawl, date) {
  let data = null
  try {
    if (crawl) {
      generationStatus[sourceID] = 'crawling'
      await crawlSource({ source: sourceID, _useUTCdate: true })
    }
    generationStatus[sourceID] = 'scraping'
    data = await scrape({ source: sourceID, date, _useUTCdate: true })
    generationStatus[sourceID] = 'done'
  }
  catch (err) {
    console.log(`${sourceID} error: ${err}`)
    generationStatus[sourceID] = 'failed'
  }
  return data
}

 /** Run asyncFunction array, poolSize at a time. */
async function asyncPool (array, poolSize) {
  const result = []
  const pool = []

  // Promises leave the pool when they're resolved.
  function leavePool (e) { pool.splice(pool.indexOf(e), 1) }

  for (const item of array) {
    const p = Promise.resolve(item())
    result.push(p)
    const e = p.then(() => leavePool(e))
    pool.push(e)
    if (pool.length >= poolSize)
      await Promise.race(pool)
  }
  return Promise.all(result).then(r => r.flat()).then(r => r.filter(e => e))
}

async function getRawScrapeData (keys, date, options) {
  function makeScrapeCall (key) {
    return async () => await scrapeData(key, options.crawl, date)
  }
  const promises = keys.map(k => makeScrapeCall(k))
  const reportingID = setInterval(() => reportGenerationStatus(), 5000)
  try {
    return await asyncPool(promises, 10)
  }
  finally {
    clearInterval(reportingID)
  }
}

async function getSourceData (key, srcPath) {
  // eslint-disable-next-line
  const source = require(srcPath)
  source._sourceKey = key
  source._key = key
  return source
}

/** Get sources. */
async function getAllSourceData (keys) {
  const srcMap = sourceMap()
  const promises = keys.map(async k => { return await getSourceData(k, srcMap[k]) })
  return Promise.all(promises).then(sources => sources.filter(s => s))
}

/** Get 'location' data (source info + case data). */
function getLocationData (sourceData, scrapeData) {
  return scrapeData.map(sd => {
    const src = sourceData.find(s => s._key === sd.source)
    assert(src, `Have source with key ${sd.source} to match scrape ${JSON.stringify(sd)}`)

    // Order here is important: we want the src first, because for JHU
    // the scrape data (country) overrides the source.
    return { ...src, ...sd, key: `${sd.country}/${sd.state}/${sd.county}/${sd.city}` }
  }).map(hsh => {
    const keep = [
      'key',
      'date',
      'cases',
      'recovered',
      'deaths',
      'active',
      'tested',
      'tests',
      'hospitalized',
      'discharged',
      'todayHospitalized',
      'icu'
    ]
    return keep.
      filter(f => Object.keys(hsh).includes(f)).
      reduce((ret, key) => {
        ret[key] = hsh[key]
        return ret
      }, {})
  })
}

function writeReport (reportPath, data) {
  // Redirecting console so that we can use console.table.
  var reportStream = fs.createWriteStream(reportPath)
  const oldWrite = process.stdout.write
  process.stdout.write = reportStream.write.bind(reportStream)

  const keys = [ ...new Set(data.map(d => d.key)) ]
  const byDate = (a, b) => { return a.date < b.date ? -1 : 1 }

  keys.forEach(k => {
    const delKey = d => { delete d.key; return d }
    const records = data.filter(d => d.key === k).map(delKey)
    console.log()
    console.log(k)
    console.table(records.sort(byDate))
  })

  process.stdout.write = oldWrite
}

/** Main generation routine. */
async function main (options) {
  try {
    if (!fs.existsSync(options.output))
      fs.mkdirSync(options.output)

    const sourceKeys = getSourceKeys(options)

    /** By default sandbox is started with port 3333; using another port
     * so this sandbox won't collide with default. */
    const sandboxPort = 5555
    await sandbox.start({ port: sandboxPort, quiet: true })

    const rawLiData = []

    for (const date of getDates(options)) {
      console.log(`\nGenerating ${date}`)

      generationStatus = {}
      generationDate = date
      sourceKeys.forEach(k => generationStatus[k] = 'pending')
      const scrapeData = await getRawScrapeData(sourceKeys, date, options)
      generationStatus = {}
      const sourceData = await getAllSourceData(sourceKeys)
      const locationData = getLocationData(sourceData, scrapeData)

      locationData.forEach(loc => {
        rawLiData.push(loc)
      })

    }  // next date

    const reportPath = join(options.output, 'report.txt')
    writeReport(reportPath, rawLiData)
    console.log()
    console.log(`done ${reportPath}.`)
  }
  finally {
    await sandbox.end()
  }
}


/**
 * Entry point.
 */

main(argv)
console.log('Done.')
