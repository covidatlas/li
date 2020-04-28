const { join, sep } = require('path')
const fs = require('fs')
const test = require('tape')
const glob = require('glob')
const sandbox = require('@architect/sandbox')

const srcShared = join(process.cwd(), 'src', 'shared')
const globJoin = require(join(srcShared, 'utils', 'glob-join.js'))
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawlerHandler = require(join(srcEvents, 'crawler', 'index.js')).handler
const scraperHandler = require(join(srcEvents, 'scraper', 'index.js')).handler
const changedSources = require(join(__dirname, '_lib', 'changed-sources.js'))

/**
 * Test new or changed scrapers.
 *
 * By default, this checks new/changed sources by diffing the current branch
 * with a baseline branch (see _lib/changed-sources.js).
 *
 * You can override this by setting some environment vars:
 *
 * TEST_ALL - tests all of the sources
 *   eg. TEST_ALL=1 npm run test:integration
 *
 * TEST_ONLY - a comma-delimited list of sources to test
 *   eg. TEST_ONLY=gb-sct,nl,gb-eng npm run test:integration
 *
 * By default, these tests also try to scrape all cached file dates
 * for the sources.  You can filter this with SCRAPE_ONLY:
 *
 * TEST_ONLY=gb-sct,nl SCRAPE_ONLY=2020-04-10,2020-04-11 npm run test:integration
 */

/** If any test failed, refer devs to docs/testing.md. */
let failcount = 0
test.onFailure(() => { failcount++ })

process.env.NODE_ENV = 'testing'

/** A fake cache, destroyed and re-created for the test run. */
const testingCache = join(process.cwd(), 'zz-testing-fake-cache')

/** By default sandbox is started with port 3333, so specifying the
 * port here lets the tests run their own sandbox without colliding
 * with the existing port. */
const sandboxPort = 5555

let sourceKeys = []
if (process.env.TEST_ALL) {
  sourceKeys = Object.keys(sourceMap())
} else if (process.env.TEST_ONLY) {
  sourceKeys = process.env.TEST_ONLY.split(',')
} else {
  sourceKeys = changedSources.getChangedSourceKeys()
}

if (sourceKeys.length === 0) {
  test('No changed sources', t => {
    t.plan(1); t.pass('hooray!')
  })
  return  // exits this module.
}

test('Setup', async t => {
  t.plan(2)
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  fs.mkdirSync(testingCache)
  t.ok(fs.existsSync(testingCache), 'Created temp directory')

  await sandbox.start({ port: sandboxPort, quiet: true })
  t.pass('Sandbox started')
})

function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

test('Live crawl', async t => {
  process.env.LI_CACHE_PATH = testingCache
  console.log(`In live crawl test: process.env.LI_CACHE_PATH = ${process.env.LI_CACHE_PATH}`)
  t.plan(sourceKeys.length + 1)
  for (const key of sourceKeys) {
    try {
      await crawlerHandler(makeEventMessage({ source: key }))
      t.pass(`${key} succeeded`)
    } catch (err) {
      t.fail(`${key} failed: ${err}`)
    }
  }
  delete process.env.LI_CACHE_PATH
  t.ok(process.env.LI_CACHE_PATH === undefined, 'no LI_CACHE_PATH')
})

// Note: this test assumes that the testingCache contains data!
test('Live scrape', async t => {
  process.env.LI_CACHE_PATH = testingCache
  console.log(`In live scrape test: process.env.LI_CACHE_PATH = ${process.env.LI_CACHE_PATH}`)
  t.plan(sourceKeys.length + 1)
  for (const key of sourceKeys) {
    try {
      const arg = makeEventMessage({ source: key, silent: true })
      const data = await scraperHandler(arg)
      // TODO (testing): verify the returned data struct conforms to schema.
      t.pass(`${key} succeeded (${data.length} record${data.length > 1 ? 's' : ''})`)
    } catch (err) {
      t.fail(`${key} failed: ${err}`)
    }
  }
  delete process.env.LI_CACHE_PATH
  t.ok(process.env.LI_CACHE_PATH === undefined, 'no LI_CACHE_PATH')
})

/**
 * List of { key, cacheDate } entries for the entire cache, so we can
 * ensure they're scrapable.
 *
 * For example, if the cache only contained
 * crawler-cache/nyt/2020-04-01, this would return:
 *   [ { key: 'nyt', cacheDate: '2020-04-01' } ]
 */
const cacheRoot = join(__dirname, '..', '..', '..', '..', 'crawler-cache')
const scrapeDates = process.env.SCRAPE_ONLY ? process.env.SCRAPE_ONLY.split(',') : []
const historicalScrapeTests = glob.sync(globJoin(cacheRoot, '*', '*')).
      map(s => { return s.replace(cacheRoot + sep, '') }).
      map(s => {
        const [ key, cacheDate ] = s.split(sep)
        return { key, cacheDate }
      }).
      filter(hsh => sourceKeys.includes(hsh.key)).
      filter(hsh => {
        return (scrapeDates.length > 0 ? scrapeDates.includes(hsh.cacheDate) : true)
      })

// This uses real cache.
test('Historical scrape', async t => {
  t.plan(historicalScrapeTests.length + 2)  // +1 cache dir check, +1 final pass
  t.ok(process.env.LI_CACHE_PATH === undefined, 'using real cache')
  for (const hsh of historicalScrapeTests) {
    const testname = `${hsh.key} cache scrape ${hsh.cacheDate}`
    try {
      const arg = makeEventMessage({ source: hsh.key, date: hsh.cacheDate, silent: true })
      const data = await scraperHandler(arg)
      // TODO (testing): verify the returned data struct conforms to schema.
      t.ok(true, `${testname} succeeded (${data.length} record${data.length > 1 ? 's' : ''})`)
    } catch (err) {
      t.fail(`${testname} failed: ${err}`)
    }
  }
  t.pass('ok')
})

test('Teardown', async t => {
  /** architect sandbox uses an internal server to handle events,
   * listening to the sandbox port + 1 (see
   * https://github.com/architect/sandbox/blob/master/src/sandbox/index.js,
   * search for 'process.env.ARC_EVENTS_PORT').  If the sandbox is
   * closed and events are still pending, ECONNREFUSED is thrown.  If
   * unhandled, this crashes the Node process, including tape, so we'll
   * ignore just these errors for the sake of testing. */
  process.on('uncaughtException', err => {
    if (err.message === `connect ECONNREFUSED 127.0.0.1:${sandboxPort + 1}`) {
      console.error('(Ignoring sandbox exception thrown during integration test Teardown)')
    }
    else
      throw err
  })

  t.plan(2)
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  t.notOk(fs.existsSync(testingCache), 'Removed temp directory')

  await sandbox.end()
  t.pass('Sandbox closed')
})

// TODO (testing) Add fake source that crawls localhost:3000/integrationtest
// Prior to running test, copy test assets there.
// Fake source can scrape data like a real scraper, easy and controlled.

// If any test failed, refer devs to docs/testing.md.
test('Summary', t => {
  t.plan(1)
  if (failcount === 0)
    t.pass('All integration tests passed')
  else
    t.fail(`${failcount} integration tests failed.  See docs/testing.md for how to handle them`)
})
