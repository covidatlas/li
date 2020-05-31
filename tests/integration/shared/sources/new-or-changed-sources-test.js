process.env.NODE_ENV = 'testing'
const sandbox = require('@architect/sandbox')
const { join, sep } = require('path')
const test = require('tape')
const glob = require('glob')

const intLib = join(process.cwd(), 'tests', 'integration', '_lib')
const testCache = require(join(intLib, 'testcache.js'))

const srcShared = join(process.cwd(), 'src', 'shared')
const globJoin = require(join(srcShared, 'utils', 'glob-join.js'))
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawl = require(join(srcEvents, 'crawler', '_crawl.js'))
const scrape = require(join(srcEvents, 'scraper', '_scrape.js'))
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

/** While crawl and scrape are separate operations, we're combining
 * them for this test because the live crawl feeds directly into the
 * scrape of the same data.  A failed crawl should just be a warning,
 * because the external site is down.  A successful crawl and a failed
 * scrape should also be a warning: the scrape no longer works, but
 * that is a problem for that source only and not for the system as a
 * whole.. */
test('Live crawl and scrape', async t => {
  await sandbox.start({ port: 5555, quiet: true })
  testCache.setup()
  t.ok(process.env.LI_CACHE_PATH !== undefined, 'using LI_CACHE_PATH')
  t.plan(sourceKeys.length + 2)

  for (const key of sourceKeys) {
    let currentStep = null
    try {
      currentStep = 'crawl'
      await crawl({ source: key })
      currentStep = 'scrape'
      const data = await scrape({ source: key })
      // TODO (testing): verify the returned data struct conforms to schema.
      t.pass(`${key} succeeded (${data.length} record${data.length > 1 ? 's' : ''})`)
    } catch (err) {
      const msg = `Warning: Live ${key} ${currentStep} failed: ${err}`
      console.log(msg)
      t.pass(`${msg}`)
    }
  }
  testCache.teardown()
  t.ok(process.env.LI_CACHE_PATH === undefined, 'no LI_CACHE_PATH')
  await sandbox.end()
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
  await sandbox.start({ port: 5555, quiet: true })
  t.plan(historicalScrapeTests.length + 2)  // +1 cache dir check, +1 final pass
  t.ok(process.env.LI_CACHE_PATH === undefined, 'using real cache')
  for (const hsh of historicalScrapeTests) {
    const testname = `${hsh.key} cache scrape ${hsh.cacheDate}`
    try {
      const data = await scrape({ source: hsh.key, date: hsh.cacheDate, _useUTCdate: true })
      // TODO (testing): verify the returned data struct conforms to schema.
      t.ok(true, `${testname} succeeded (${data.length} record${data.length > 1 ? 's' : ''})`)
    } catch (err) {
      t.fail(`${testname} failed: ${err}`)
    }
  }
  t.pass('ok')
  await sandbox.end()
})

// If any test failed, refer devs to docs/testing.md.
test('Summary', t => {
  t.plan(1)
  if (failcount === 0)
    t.pass('All integration tests passed')
  else
    t.fail(`${failcount} integration tests failed.  See docs/testing.md for how to handle them`)
})
