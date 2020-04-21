const path = require('path')
const fs = require('fs')
const test = require('tape')

const srcShared = path.join(process.cwd(), 'src', 'shared')
const datetime = require(path.join(srcShared, 'datetime', 'index.js'))
const sourceMap = require(path.join(srcShared, 'sources', '_lib', 'source-map.js'))
const changedSources = require('./_lib/changed-sources.js')

const srcEvents = path.join(process.cwd(), 'src', 'events')
const crawlerHandler = require(path.join(srcEvents, 'crawler', 'index.js')).handler
const scraperHandler = require(path.join(srcEvents, 'scraper', 'index.js')).handler


process.env.NODE_ENV = 'testing'
process.env.LI_CACHE_PATH = path.join(process.cwd(), 'zz-testing-fake-cache')

let sourceKeys = []
if (process.env.TEST_ALL) {
  sourceKeys = Object.keys(sourceMap())
} else if (process.env.TEST_ONLY) {
  sourceKeys = [process.env.TEST_ONLY]
} else {
  sourceKeys = changedSources.getChangedSourceKeys()
}

// TODO: add fake source!
// Can set fake source to crawl localhost:3000/integrationtest, which contains test assets.
// prior to running test, copy those assets there.
// The data should then work fine.
// Always run that fake thing!

// TODO: make it all parallel!

const today = datetime.today.utc()

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

for (const key of sourceKeys) {
  test(`${key} for ${today}`, async t => {
    t.plan(3)
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
      const data = await scraperHandler(scrapeArg)
      t.ok(`${key} scrape completed successfully.`)

      // TODO (testing) verify that data matches a particular schema
      // e.g.
      //  const scraper = getScraper(key)
      //  if (scraper.timeseries) {
      //    checkMatchesTimeseriesSchema(t, data)
      //  } else {
      //    checkMatchesDataSchema(t, data)
      //  }

      // TODO (testing) verify that data was actually written.
      t.ok(`${key} data written successfully.`)

    } catch(err) {
      t.fail(err)
    }
    finally {
      teardown()
    }
    t.end()
  })
}
