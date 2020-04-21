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
