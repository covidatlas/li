const { join, sep } = require('path')
const fs = require('fs')
const test = require('tape')
const glob = require('glob')
const sandbox = require('@architect/sandbox')

const srcShared = join(process.cwd(), 'src', 'shared')
const datetime = require(join(srcShared, 'datetime', 'index.js'))
const globJoin = require(join(srcShared, 'utils', 'glob-join.js'))
const sourceMap = require(join(srcShared, 'sources', '_lib', 'source-map.js'))
const srcEvents = join(process.cwd(), 'src', 'events')
const crawlerHandler = require(join(srcEvents, 'crawler', 'index.js')).handler
const scraperHandler = require(join(srcEvents, 'scraper', 'index.js')).handler
const changedSources = require(join(__dirname, '_lib', 'changed-sources.js'))

/** Test new or changed scrapers.
 *
 * By default, this checks new/changed sources by diffing the current branch
 * with a baseline branch (see _lib/changed-sources.js).
 *
 * You can override this by setting some environment vars:
 *
 * TEST_ALL - tests all of the sources
 * e.g., TEST_ALL=1 npm run test:integration
 *
 * TEST_ONLY - a comma-delimited list of sources to test
 * TEST_ONLY=gb-sct,nl,gb-eng npm run test:integration
 */


//////////////////////////////////////////////////////////////////////
// Utilities

/** Split an array into batches, e.g.:
 * makeBatches([1,2,3,4,5], 3) = [[1,2,3], [4,5]]
 */
function makeBatches (arr, batchsize) {
  const ret = []
  for (let i = 0; i < arr.length; i += batchsize)
    ret.push(arr.slice(i, i + batchsize))
  return ret
}

/** Runs the crawl for a given source, returning a struct indicating
 * which steps succeeded. */
async function runCrawl (key, today) {
  const result = {
    key: key,
    success: false,
    error: null
  }

  try {
    const crawlArg = {
      Records: [
        { Sns: { Message: JSON.stringify({ source: key, date: today }) } }
      ]
    }
    await crawlerHandler(crawlArg)
    result.success = true
  } catch (err) {
    console.log(`error: ${err}`)
    // I tried 'result.error = err' below, but that did not work: the
    // returned object only contained '"error":{}'.  Changing it to a
    // string preserved the details.  Not ideal, but not terrible.
    result.error = `error: ${err}`
  }

  return result
}

/** Gets the dates for a given source key.
 *
 * For example, if the cache only contained crawler-cache/nyt/2020-04-01,
 * this would return ['2020-04-01'].
 */
function getCacheDatesForSourceKey (key) {
  const cacheRoot = join(__dirname, '..', '..', '..', '..', 'crawler-cache')
  const folders = glob.sync(globJoin(cacheRoot, key, '*'))
  const re = new RegExp(`^.*crawler-cache${sep}${key}${sep}`)
  const ret = folders.map(f => f.replace(re, ''))
  return ret
}

/** Runs scrape for a given source, returning a struct indicating
 * which steps succeeded. */
async function runScrape (key, dt) {
  const result = {
    key: key,
    date: dt,
    success: false,
    error: null,
    data: null
  }

  try {
    const scrapeArg = {
      Records: [
        { Sns: { Message: JSON.stringify({ source: key, date: dt, silent: true }) } }
      ]
    }
    const data = await scraperHandler(scrapeArg)
    result.data = data
    result.success = true
  } catch (err) {
    console.log(`error: ${err}`)
    // I tried 'result.error = err' below, but that did not work: the
    // returned object only contained '"error":{}'.  Changing it to a
    // string preserved the details.  Not ideal, but not terrible.
    result.error = `error: ${err}`
  }

  return result
}


/** Runs operation successively in batches, but run each item
 * in one batch run in parallel, generating subtests under
 * maintest. */
function runBatchedOperation (maintest, opname, operations, batchSize) {
  const batchedOperations = makeBatches(operations, batchSize)
  return new Promise(resolve => {
    var allResults = []
    var index = 0
    function runNextBatch () {
      if (index < batchedOperations.length) {
        const ops = batchedOperations[index]
        const batchmsg = `batch ${index + 1} of ${batchedOperations.length}`
        const comment = `${opname} (${batchmsg})`
        maintest.comment(comment)
        Promise.all(ops.map(o => o.execute())).
          then(results => {
            allResults.push(results)
            runNextBatch()
          })
        index += 1
      } else {
        resolve(allResults.flat())
      }
    }
    // start first iteration
    runNextBatch()
  })
}

/** For debugging only. */
// eslint-disable-next-line no-unused-vars
function printResults (results) {
  console.log("Results (minus data):")
  results.forEach(r => {
    console.log('------------------------------')
    let copy = r
    delete copy.data
    console.log(JSON.stringify(copy))
  })
  return results
}

//////////////////////////////////////////////////////////////////////
// The tests


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
  // This return will exit this test module.
  return
}

// If any test failed, refer devs to docs/testing.md.
let showFailureAdvice = false
test.onFailure(() => { showFailureAdvice = true })

const batchSize = 20  // arbitrary.

process.env.NODE_ENV = 'testing'

// A fake cache, destroyed and re-created for the test run.
const testingCache = join(process.cwd(), 'zz-testing-fake-cache')

test('Setup', async t => {
  t.plan(2)
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  fs.mkdirSync(testingCache)
  t.ok(fs.existsSync(testingCache), 'Created temp directory')

  // If this isn't set local auth breaks.
  process.env.CRAWL_TOKEN = 'testing'

  // By default sandbox is started with port 3333, so specifying the
  // port here lets the tests run their own sandbox without
  // colliding with the existing port.
  await sandbox.start({ port: 5555, quiet: true })
  t.pass('Sandbox started')
})

function createCrawlCall (key) {
  return {
    name: key,
    execute: () => { return runCrawl(key) }
  }
}

test('Live crawl, new or changed sources', async t => {
  process.env.LI_CACHE_PATH = testingCache
  t.plan(sourceKeys.length + 1)
  const crawls = sourceKeys.map(k => createCrawlCall(k))
  // TODO look into how we can clean up the parallelization
  await runBatchedOperation(t, 'Live crawl', crawls, batchSize)
    .then(results => {
      results.forEach(result => {
        t.test(`Live crawl: ${result.key}`, innert => {
          innert.plan(2)
          innert.ok(result.success, 'completed successfully')
          innert.ok(result.error === null, `null error "${result.error}"`)
        })
      })
    })
  delete process.env.LI_CACHE_PATH
  t.ok(process.env.LI_CACHE_PATH === undefined, 'no LI_CACHE_PATH')
})

function createScrapeCall (key, date) {
  return {
    name: `${key} for ${date}`,
    execute: () => { return runScrape (key, date) }
  }
}

// Note: this test assumes that the testingCache contains data!
test('Live scrape, new or changed sources', async t => {
  process.env.LI_CACHE_PATH = testingCache
  const today = datetime.today.utc()
  t.plan(sourceKeys.length + 1)
  const scrapes = sourceKeys.map(k => createScrapeCall(k, today))
  // TODO look into how we can clean up the parallelization
  await runBatchedOperation(t, 'Live scrape', scrapes, batchSize)
    .then(results => {
      results.forEach(result => {
        t.test(`Live scrape: ${result.key}, today`, innert => {
          innert.plan(3)
          innert.ok(result.success, 'completed successfully')
          innert.ok(result.error === null, `null error "${result.error}"`)
          innert.ok(result.data !== null, 'got data')
        })
      })
    })
  delete process.env.LI_CACHE_PATH
  t.ok(process.env.LI_CACHE_PATH === undefined, 'no LI_CACHE_PATH')
})

// This uses real cache.
test('Historical scrape, new or changed sources', async t => {
  // List of date folders for each key, e.g.:
  // [ { key: 'gb-eng', date: '2020-04-02'}, {... ]
  const scrapeTests = sourceKeys.map(k => {
    return getCacheDatesForSourceKey(k).
      map(dt => { return { key: k, date: dt } })
  }).flat()

  t.plan(scrapeTests.length + 2)  // +1 cache dir check, +1 final pass
  t.ok(process.env.LI_CACHE_PATH === undefined, 'using real cache')

  const scrapes = scrapeTests.map(st => createScrapeCall(st.key, st.date))

  // TODO look into how we can clean up the parallelization
  await runBatchedOperation(t, 'Historical scrape', scrapes, batchSize)
    .then(results => {
      results.forEach(result => {
        t.test(`Historical scrape: ${result.key} scrape on ${result.date}`, innert => {
          innert.plan(3)
          innert.ok(result.success, 'completed successfully')
          innert.ok(result.error === null, `null error "${result.error}"`)
          innert.ok(result.data !== null, 'got data')
        })
      })
    })

  t.pass('ok')
})

test('Teardown', async t => {
  t.plan(2)
  if (fs.existsSync(testingCache)) {
    fs.rmdirSync(testingCache, { recursive: true })
  }
  t.notOk(fs.existsSync(testingCache), 'Removed temp directory')
  delete process.env.CRAWL_TOKEN
  await sandbox.end()
  t.pass('Sandbox closed')
})

// TODO (testing) Add fake source that crawls localhost:3000/integrationtest
// Prior to running test, copy test assets there.
// Fake source can scrape data like a real scraper, easy and controlled.


// If any test failed, refer devs to docs/testing.md.
test('New or changed sources test summary', t => {
  t.plan(1)
  if (showFailureAdvice) {
    t.fail('Some integration tests failed.  See docs/testing.md for how to handle them')
  } else {
    t.ok(true, 'All tests passed')
  }
})
