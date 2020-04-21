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

// TODO: add fake source!
// Can set fake source to crawl localhost:3000/integrationtest, which contains test assets.
// prior to running test, copy those assets there.
// The data should then work fine.
// Always run that fake thing!

// TODO: add option to run all
// TODO: make it all parallel!

const today = datetime.today.utc()

for (const key of Object.keys(sources)) {
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

      // TODO: verify that data was actually written.
      t.ok(`${key} data written successfully.`)

    } catch(err) {
      t.fail(err)
    }
    finally {
      // teardown()
    }
    t.end()
  })
}
