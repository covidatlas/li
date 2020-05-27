process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const fs = require('fs')
const path = require('path')
const testCache = require('../../_lib/testcache.js')

const firstPage = {
  records: [
    { counter: 'a1', cases: 1 },
    { counter: 'a2', cases: 2 }
  ],
  nextUrl: 'http://localhost:5555/tests/fake-source-urls/paginated-json/page2.json'
}

const lastPage = {
  records: [
    { counter: 'a3', cases: 3 }
  ]
}


async function doCrawl (t) {
  try {
    await utils.crawl('paginated-json')
    t.pass('crawl succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }
}

test('scrape completes successfully', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)
  t.equal(3, testCache.allFiles().length, 'sanity check, all files after crawl.')

  try {
    await utils.scrape('paginated-json')
    t.pass('scrape succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }

  await utils.teardown()
  t.end()
})

test('scrape gets all pages of data', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)
  t.equal(3, testCache.allFiles().length, 'all files after crawl.')

  let fullResult
  try {
    fullResult = await utils.scrape('paginated-json')
    t.pass('scrape succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }

  const expected = [
    { counter: 'a1', cases: 1, deaths: 5 },
    { counter: 'a2', cases: 2, deaths: 5 },
    { counter: 'a3', cases: 3, deaths: 5 }
  ]
  utils.validateResults(t, fullResult, expected)

  await utils.teardown()
  t.end()
})

/** arcgis (e.g., JP) was first added to this project before
 * pagination support was added, so one of their data sources
 * (e.g. 'default') has already been saved into the cache as
 * `{datetime}-default-{sha}.{ext}.gz`.  We want to scrape that with
 * the same code, because the page format hasn't changed.  So, allow
 * `-default-{sha}` to be scraped as if it was paginated as
 * `-default-0-`. */
test('scrape can handle a cached first page with no pagination number', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)
  t.equal(2, testCache.allFiles().length, 'all files after crawl.')

  const cachedCases = testCache.allFiles().filter(f => f.match(/-cases-0-/))
  t.equal(cachedCases.length, 1, 'single cases file')
  const f = path.join(testCache.testingCache, cachedCases[0])
  fs.renameSync(f, f.replace('-cases-0-', '-cases-'))

  let fullResult
  try {
    fullResult = await utils.scrape('paginated-json')
    t.pass('scrape succeeded')
  }
  catch (err) {
    t.fail(err)
    t.fail(err.stack)
  }

  const expected = [
    { counter: 'a3', cases: 3, deaths: 5 }
  ]
  utils.validateResults(t, fullResult, expected)

  await utils.teardown()
  t.end()
})

// TODO tests for paginated
// scrape gets latest set of paginated files
// scrape gets correct set of paginated files
// timeseries scrape gets latest set of paginated files
// lots of pages (> 10) should still work for selecting all the pages
