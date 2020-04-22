const { join } = require('path')
const fs = require('fs')
const test = require('tape')
const sandbox = require('@architect/sandbox')

const srcShared = join(process.cwd(), 'src', 'shared')
const datetime = require(join(srcShared, 'datetime', 'index.js'))
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

process.env.NODE_ENV = 'testing'

// A fake cache, destroyed and re-created for the test run.
process.env.LI_CACHE_PATH = join(process.cwd(), 'zz-testing-fake-cache')


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


/** Runs scrape for a given source, returning a struct indicating
 * which steps succeeded. */
async function runScrape (key, today) {
  const result = {
    key: key,
    success: false,
    error: null,
    data: null
  }

  try {
    const scrapeArg = {
      Records: [
        { Sns: { Message: JSON.stringify({ source: key, date: today, silent: true }) } }
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
function runBatchedOperation (maintest, operations, batchSize) {
  const batchedOperations = makeBatches(operations, batchSize)
  return new Promise(resolve => {
    var allResults = []
    var index = 0
    function runNextBatch () {
      if (index < batchedOperations.length) {
        const ops = batchedOperations[index]
        const comment = `Running ${ops.map(o => o.name).join(', ')} (batch ${index + 1} of ${batchedOperations.length})`
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

const batchSize = 20  // arbitrary.

const d = process.env.LI_CACHE_PATH

if (sourceKeys.length === 0) {

  test('No changed sources', t => {
    t.plan(1); t.pass('hooray!')
  })

} else {

  test('Setup', async t => {
    t.plan(2)
    if (fs.existsSync(d)) {
      fs.rmdirSync(d, { recursive: true })
    }
    fs.mkdirSync(d)
    t.ok(fs.existsSync(d), 'Created temp directory')
    await sandbox.start({ quiet: true })
    t.pass('Sandbox started')
  })

  function createCrawlCall (key) {
    return {
      name: key,
      execute: () => { return runCrawl(key) }
    }
  }

  test('New or changed sources, crawl', async t => {
    t.plan(sourceKeys.length)
    const crawls = sourceKeys.map(k => createCrawlCall(k))
    // TODO look into how we can clean up the parallelization
    await runBatchedOperation(t, crawls, batchSize)
      .then(results => {
        results.forEach(result => {
          test(`Crawl source: ${result.key}`, t => {
            t.plan(2)
            t.ok(result.success, 'completed successfully')
            t.ok(result.error === null, `null error "${result.error}"`)
          })
          t.pass(`${result.key} ok`)
        })
      })
  })

  function createScrapeCall (key, date) {
    return {
      name: `${key} for ${date}`,
      execute: () => { return runScrape (key, date) }
    }
  }

  // Note this test assumes that the cache contains data.
  test('New or changed sources, scrape', async t => {
    const today = datetime.today.utc()
    t.plan(sourceKeys.length)
    const scrapes = sourceKeys.map(k => createScrapeCall(k, today))
    // TODO look into how we can clean up the parallelization
    await runBatchedOperation(t, scrapes, batchSize)
      .then(results => {
        results.forEach(result => {
          test(`Scrape source: ${result.key}`, t => {
            t.plan(3)
            t.ok(result.success, 'completed successfully')
            t.ok(result.error === null, `null error "${result.error}"`)
            t.ok(result.data !== null, 'got data')
          })
          t.pass(`${result.key} ok`)
        })
      })
  })

  test('Teardown', async t => {
    t.plan(2)
    if (fs.existsSync(d)) {
      fs.rmdirSync(d, { recursive: true })
    }
    t.notOk(fs.existsSync(d), 'Removed temp directory')
    await sandbox.end()
    t.pass('Sandbox closed')
  })

  // TODO (testing) Add fake source that crawls localhost:3000/integrationtest
  // Prior to running test, copy test assets there.
  // Fake source can scrape data like a real scraper, easy and controlled.
}
