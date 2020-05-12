/** Generate raw files of sources to disk, doing a crawl and scrape.
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
 * # For today, single scraper, and do a crawl first:
 * $ node tools/gen-raw-files.js --output zz-kr-out --source kr --crawl
 *
 * If the --output folder is "coronadatascraper/dist-raw", or the
 * files generated from this tool are moved or copied there, these
 * files can be consumed as part of the regular CDS report generation.
 *
 */

/** NODE_ENV must be 'testing' to ensure the sandbox is loaded
 * correctly; otherwise, we get 'InvalidAccessKeyId' errors. */
process.env.NODE_ENV = 'testing'

const { join } = require('path')
const fs = require('fs')
const is = require('is')
const assert = require('assert')
const sandbox = require('@architect/sandbox')

const srcLib = join(process.cwd(), 'src', 'shared', 'sources', '_lib')
const datetime = require(join(process.cwd(), 'src', 'shared', 'datetime', 'index.js'))
const sourceMap = require(join(srcLib, 'source-map.js'))
const findScraper = require(join(srcLib, 'find-scraper.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawlSource = require(join(srcEvents, 'crawler', '_crawl.js'))
const crawler = require(join(srcEvents, 'crawler', 'crawler'))
const calculateScraperTz = require(join(srcEvents, 'scraper', 'find-tz', 'index.js'))
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

/*
  console.log('--------------------------------------------------')
  console.log('Called gen-raw-files with arguments:')
  console.log(JSON.stringify(argv, null, 2))
  console.log('--------------------------------------------------')
*/

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
async function getSingleRawData (sourceID, crawl, date) {
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
    return async () => await getSingleRawData(key, options.crawl, date)
  }
  const promises = keys.map(k => makeScrapeCall(k))
  const reportingID = setInterval(() => reportGenerationStatus(), 5000)
  try {
    return await asyncPool(promises, 10)
  }
  finally {
    clearInterval(reportingID)
    reportGenerationStatus()
  }
}

async function getUrl (scraper) {
  // Arbitrarily picking the first crawl URL as the URL to report.
  let ret = scraper.crawl[0].url
  if (is.function(ret)) {
    try {
      ret = await ret(crawler.client)
      if (typeof(ret) !== 'string')
        ret = ret.url
    }
    catch (err) {
      ret = `Error: ${err}`
    }
  }
  return ret
}

/** Create a CDS-reporting-compatible representation of the Li
 * scraper.  This will let us combine this scraper data with the
 * scraper data from CDS, to generate the flat files. */
async function getSourceData (key, map, date) {
  const srcPath = map[key]

  // eslint-disable-next-line
  const source = require(srcPath)
  source._sourceKey = key
  let scraper = null
  try {
    scraper = findScraper(source, date)
  } catch (err) {
    console.log(`${key}: No scraper at ${date}`)
    return null
  }

  const baseUrl = await getUrl(scraper)
  const tz = await calculateScraperTz(source)

  let cdsCompatibleSource = {
    _key: key,   // Later will use _key to join this and scrape data.
    _path: srcPath,
    url: baseUrl,
    scraperTz: tz,
    type: scraper.crawl[0].data, // Used in CDS for ratings.
  }

  if (source.friendly)
    cdsCompatibleSource.sources = [ source.friendly ]

  const copyfields = [
    'country',
    'state',
    'county',
    'maintainers',
    'priority',
    'timeseries',
    'headless',
    'certValidation',
    'aggregate'
  ]
  cdsCompatibleSource = copyfields.reduce((hsh, field) => {
    if (source[field] !== undefined)
      hsh[field] = source[field]
    return hsh
  }, cdsCompatibleSource)

  return cdsCompatibleSource
}

/** Only export keys that are used during CDS reporting (presumably!).
 *
 * The lists of keys to include were determined by running `yarn
 * raw:scrape` in CDS, and looking at the generated key files
 * (dist-raw/raw-sources-keys and dist-raw/raw-locations-keys).
 */
function onlySpecifiedKeys (arrOfHashes, keys) {
  return arrOfHashes.map(hsh => {
    const keepKeys = keys.filter(k => Object.keys(hsh).includes(k))
    return keepKeys.reduce((ret, key) => {
      ret[key] = hsh[key]
      return ret
    }, {})
  })
}

/** Get CDS-report-compatible structures of all Li sources. */
async function getAllSourceData (keys, date) {
  const srcMap = sourceMap()
  const promises = keys.map(async k => { return await getSourceData(k, srcMap, date) })
  let sources = await Promise.all(promises)
  sources = sources.filter(s => s)
  const cdsSourceKeys = [
    '_key',  // Not included in CDS, but keeping it just in case.
    '_path',
    'county',
    'state',
    'country',
    'maintainers',
    'url',
    'type',
    'timeseries',
    'headless',
    'certValidation',
    'priority',
    'aggregate',
    'curators',
    'scraperTz',
  ]
  return onlySpecifiedKeys(sources, cdsSourceKeys)
}

/** Get CDS-compatible "location" data. */
function getLocationData (sourceData, scrapeData) {
  let locationData = scrapeData.map(sd => {
    const src = sourceData.find(s => s._key === sd.source)
    assert(src, `Have source with key ${sd.source} to match scrape ${JSON.stringify(sd)}`)
    return { ...sd, ...src }
  })
  const cdsLocationKeys = [
    '_path',
    'county',
    'state',
    'country',
    'maintainers',
    'url',
    'type',
    'timeseries',
    'headless',
    'certValidation',
    'priority',
    // 'sources',
    'cases',
    'recovered',
    'deaths',
    'active',
    'tested',
    'tests',
    'hospitalized',
    'aggregate',
    'discharged',
    'todayHospitalized',
    'icu',
    'population',
    'coordinates',
    'curators',
    'city',
    'publishedDate',
    'scraperTz',
  ]
  return onlySpecifiedKeys(locationData, cdsLocationKeys)
}

/** Report filenames.
 *
 * This filenames are used in CDS during the `yarn raw:reportcombined`
 * script, so any changes here will require changes there as well.
*/
function reportFilenames (options, date) {
  let suffix = ''

  // If a date was specified in options, or we're looping through a range,
  // use the supplied date.
  if (options.date || options.startDate)
    suffix = `-${datetime.getYYYYMMDD(date)}`

  return {
    sourcesPath: join(options.output, `raw-li-sources${suffix}.json`),
    scrapePath: join(options.output, `raw-li-scrape${suffix}.json`),
    locationsPath: join(options.output, `raw-li-locations${suffix}.json`)
  }
}

function saveReport (filename, data) {
  console.log(`Saving ${filename}`)
  fs.writeFileSync(filename, JSON.stringify(data, null, 2))
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

    for (const date of getDates(options)) {
      console.log('\n')
      console.log('='.repeat(40))
      console.log(`Generating ${date}`)

      generationStatus = {}
      generationDate = date
      sourceKeys.forEach(k => generationStatus[k] = 'pending')
      const scrapeData = await getRawScrapeData(sourceKeys, date, options)
      generationStatus = {}

      if (scrapeData.length === 0) {
        console.log(`No data scraped for ${date}, skipping file save.`)
        continue
      }

      const filenames = reportFilenames(options, date)

      saveReport(filenames.scrapePath, scrapeData)

      const generatedSourceKeys = scrapeData.
        map(sd => sd.source).
        filter((value, index, self) => self.indexOf(value) === index)
      const sourceData = await getAllSourceData(generatedSourceKeys, date)
      saveReport(filenames.sourcesPath, sourceData)

      const locationData = getLocationData(sourceData, scrapeData)
      saveReport(filenames.locationsPath, locationData)
    }

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
