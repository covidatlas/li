const path = require('path')
const fs = require('fs')
const test = require('tape')
const is = require('is')
const yargs = require('yargs')

const srcShared = path.join(process.cwd(), 'src', 'shared')
const datetime = require(path.join(srcShared, 'datetime', 'index.js'))
const sourceMap = require(path.join(srcShared, 'sources', '_lib', 'source-map.js'))
const allowedTypes = require(path.join(srcShared, 'sources', '_lib', 'types.js')).allowedTypes
const parseCache = require(path.join(process.cwd(), 'src', 'events', 'scraper', 'parse-cache', 'index.js'))
const loadFromCache = require(path.join(process.cwd(), 'src', 'events', 'scraper', 'load-cache', 'index.js'))
const changedSources = require('./_lib/changed-sources.js')

const srcEvents = path.join(process.cwd(), 'src', 'events')
const crawlerHandler = require(path.join(srcEvents, 'crawler', 'index.js')).handler
const scraperHandler = require(path.join(srcEvents, 'scraper', 'index.js')).handler


const changedFiles = changedSources.getChangedSources()
console.log(`Running tests for new or changed scrapers:`)
changedFiles.map(f => f.replace(process.cwd(), '')).map(f => { console.log(`* ${f}`) })

process.env.NODE_ENV = 'testing'
process.env.LI_CACHE_PATH = path.join(process.cwd(), 'zz-testing-fake-cache')

function setup() {
  const d = process.env.LI_CACHE_PATH
  if (fs.existsSync(d)) {
    fs.rmdirSync(d, { recursive: true })
  }
  fs.mkdirSync(d)
}

function teardown() {
  const d = process.env.LI_CACHE_PATH
  if (fs.existsSync(d)) {
    fs.rmdirSync(d, { recursive: true })
  }
}

const checkSources = Object.entries(sourceMap()).
      reduce((useSource, keyvaluepair) => {
        const [key, filepath] = keyvaluepair
        const shortpath = filepath.replace(`${process.cwd()}${path.sep}`, '')
        if (changedFiles.includes(shortpath)) {
          useSource[key] = filepath
        }
        return useSource
      }, {})

let sources = {}
for (const [key, filepath] of Object.entries(checkSources)) {
  // eslint-disable-next-line
  sources[key] = require(filepath)
}

const today = datetime.today.utc()

for (const [key, source] of Object.entries(sources)) {
  test(`${key} for ${today}`, async t => {
    t.plan(2)
    try {
      setup()

      const crawlArg = {
        Records: [
          { Sns: { Message: JSON.stringify({source: key}) } }
        ]
      }
      await crawlerHandler(crawlArg)
      t.ok(`${key} crawl completed successfully.`)

      const scrapeArg = {
        Records: [
          { Sns: { Message: JSON.stringify({source: key, date: today, silent: true}) } }
        ]
      }
      await scraperHandler(crawlArg)
      t.ok(`${key} scrape completed successfully.`)

    } catch(err) {
      t.fail(err)
    }
    finally {
      // teardown()
    }
    t.end()
  })
}


////    
////      
////    test.only('dummy', t => { t.end() })
////      
////    /*
////    For each source in the list
////    do crawl now
////    do scrape with that thing
////    that's it.
////    */
////    
////    //////////////////////////////////////////////////////////////
////    // Actual crawl tests.
////    
////    
////    // Maybe do do this ...
////    
////    // Don't do this: we shouldn't be mixing fakes with real things.
////    // if (process.env.ADD_FAKE_SCRAPER) {
////    //   console.log('Adding fake scraper for tests.')
////    //   sources['FAKE'] = fakeSource
////    // }
////    
////    if (process.env.ONLY_FAKE_SCRAPER) {
////      sources = {}
////      console.log('Using ONLY fake scraper for tests.')
////      sources['FAKE'] = fakeSource
////    }
////    
////    const scraperDates = source => { return source.scrapers.map(s => s.startDate) }
////    const crawlsOnDate = (source, dt) => {
////      return source.scrapers.filter(s => s.startDate === dt)[0].crawl
////    }
////    const scrapeOnDate = (source, dt) => {
////      return source.scrapers.filter(s => s.startDate === dt)[0].scrape
////    }
////    
////    
////    /** For real sources, this actually calls loadFromCache.  For the
////     * fakeSource, use fake responses. */
////    async function loadFromCacheForTests(source, scraper, date) {
////      // TODO How can we ensure that this is set correctly?
////      process.env.NODE_ENV = 'testing'
////      if (source == fakeSource)
////        return fakeSourceLoadCacheResultFor(date)
////      const params = { source, scraper, date, tz: 'America/Los_Angeles' }
////      const cache = await loadFromCache(params)
////      const parsed = await parseCache(cache, date)
////      return parsed
////    }
////    
////    
////    ////////////////////////////////////////////////////////////////////
////    /** Master test
////    
////    This set of tests runs live crawls and scrapes for today for all
////    sources using live data.
////    
////    Since we can't rely 100% on live sites, nor on scrapes actually being
////    up-to-date with the latest changes on live sites, these tests print
////    out warnings in some cases, and failures in others.  The tests also
////    successively narrow down the set of checks run on sources, depending
////    on the status of prior steps.
////    */
////    
////    // fake var for demo only
////    let _cacheCount = 42
////    
////    
////    // TODO - use a fresh directory?
////    // create temp dir, and use reset
////    // right now it's hard path out to root dir
////    // TODO - create "override cache location"
////    //
////    function getCacheCountFor(src, dt) {
////      // TODO - create a separate dir
////      return _cacheCount
////    }
////    
////    // TODO: start the sandbox and run the event
////    // TODO: _could_ directly run the event, but have to run it directly - could use a payload, but have to get the sig right.
////    
////    // TODO use process.env.LI_CACHE_PATH
////    
////    /** TODO: this should return the proper object for scraping. */
////    async function doCrawl(src, dt) {
////      // TODO - start sandbox, fire event
////      // TODO - wait until files are there, and then go nuts and create the final struct
////    
////      /*
////    event:
////    const crawlArg = {
////      Records: [
////        { Sns: { Message: JSON.stringify({source: 'us-fl-hellhole'}) } }
////      ]
////    }
////    
////    pass to crawler index function .handler!!!!
////    
////    This completes,
////    
////    loadCache
////    parseCache
////    
////       */
////    
////      // Sample data set, multiple sources:
////      return { sourceA: { number: 42 }, sourceB: { number: 41 } }
////    
////      // Sample data set, single source:
////      // return { cases: 42 }
////    
////      _cacheCount += 1
////    }
////    
////    function getScrapeForDate(src, dt) {
////      // TODO - filter and return correct one, or null if not there.
////      return (obj) => { console.log('scraping') }
////    }
////    
////    async function doScrape(scrape, dataToScrape) {
////      // TODO
////      scrape(dataToScrape)
////      // throw errors back up
////    }
////    
////    /**
////     * During the masterTest (of crawl/scrape), we want to highlight
////     * things that we should be aware of, but which aren't necessarily
////     * failures.
////     */
////    class TestWarningError extends Error {
////      constructor(message) {
////        super(`Test warning: ${message}`)
////        this.name = 'TestWarningError'
////      }
////    }
////    
////    class CacheOnlyScraperError extends Error {
////      constructor(message) {
////        super(message)
////        this.name = 'CacheOnlyScraperError'
////      }
////    }
////    
////    // Errors are thrown back up to the calling function.
////    async function masterTest(t, key, src, dt) {
////      // Crawl.
////      // If the crawl doesn't work, it could be due to the source being down.
////      // We can't depend on external sites, so report that as a warning only.
////      // Hold on to the dataset returned so we can pass it to scrape.
////      const oldCacheFileCount = getCacheCountFor(src, dt)
////      let dataToScrape = null
////      try {
////        dataToScrape = await doCrawl(src, dt)
////        t.ok(`${key}: crawl completed successfully`)
////      } catch (err) {
////        throw new TestWarningError(`${key}: crawl error: ${err}`)
////      }
////      const newCacheFileCount = getCacheCountFor(src, dt)
////      if (newCacheFileCount === oldCacheFileCount)
////        throw new TestWarningError(`${key}: Cache count didn't change`)
////    
////      if (dataToScrape === null)
////        throw new Error(`${key}: null data?  Shouldn't happen if crawl worked!`)
////    
////      const scrape = getScrapeForDate(src, dt)
////      if (scrape === null) {
////        // cache-only source, do nothing, ignore later.
////        throw new CacheOnlyScraperError(key)
////      }
////    
////      // Scrape.  If the scrape failed, it could be because the source
////      // format has changed.  We can't depend on that, and our tests
////      // should not fail b/c of that, but should report a warning.
////      try {
////        await doScrape(scrape, dataToScrape)
////        t.ok(`${key}: scrape completed successfully`)
////      } catch (err) {
////        throw new TestWarningError(`${key}: scrape error: ${err}`)
////      }
////    
////      // If we got here, great.  We need to check if that scrape can
////      // handle bad data.
////      return [scrape, dataToScrape]
////    }
////    
////    
////    // All scrapers with cache:
////    // do a scrape
////    
////    // crawl tests
////    // If --crawl-all, run all latest crawls.  Report failures as warnings.
////    // If --sources, use just those
////    // If --run-changed, use diff of names.  need --origin and --branch set for that
////    
////    // scrape tests
////    // If --use-fake, use just that
////    // If --sources, use just those
////    // If --run-changed, use diff of names.  need --origin and --branch set for that
////    
////    // sources = fake || changed || all || <list>
////    
////    // Hit cache first - local, then S3
////    // if new source not in local cache, hit live
////    // second param in load cache, useS3 true = attempt to load out of S3 first
////    // if fails, then run normal cache thing hitting S3 directory
////    // if no cache, then run crawl
////    
////    
////    // New scapers
////    // do a crawl  (don't want to use cache, b/c the prior cache may not be valid, eg due to URL changes in the commit)
////    // run scrape
////    
////    
////    // TODO: only run this for changed scrapers
////    // TODO: add args for script to run for changed scrapers
////    // TODO: for changed scraper: run the crawl
////    // TODO: for changed scraper: run scrape
////    // TODO: for changed scraper: run scrape arg permutations
////    // TODO: remove funky error types - just throw
////    // TODO: update the GitHub issue
////    
////    
////    // Run the master test for each source.
////    // TODO: parallelize this for speed.  Will require changes in err throws and warnings.
////    for (const [key, src] of Object.entries(sources)) {
////    
////      // If the crawl and scrape are successful for the source, we'll
////      // exercise the scrape method in further tests.
////      let scrape = null
////      let dataToScrape = null
////    
////      test(`crawl and scrape for ${key} for ${today}`, t => {
////        try {
////          [scrape, dataToScrape] = masterTest(t, key, src, today)
////        } catch (err) {
////          // TODO: handle warnings, cache-only scrapers differently
////          t.fail(`${err}`)
////        }
////        finally {
////          t.end()
////        }
////      })
////    
////      if (!(scrape && dataToScrape)) {
////        // The crawl and scrape didn't complete successfully, don't bother
////        // with further tests.
////        continue
////      }
////    
////      test(`${key} for ${today}: scrape throws if any data key is missing`, t => {
////        // TODO - mostly implemented much further above.
////      })
////    
////      test(`${key} for ${today}: scrape throws if any data is invalid`, t => {
////        // TODO - mostly implemented much further above.
////      })
////    
////    }
