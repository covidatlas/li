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
  sourceKeys = process.env.TEST_ONLY.split(',')
} else {
  sourceKeys = changedSources.getChangedSourceKeys()
}


function makeBatches(arr, batchsize) {
  const ret = []
  for (let i = 0; i < arr.length; i += batchsize)
    ret.push(arr.slice(i, i + batchsize))
  return ret
}

test.skip('makeBatches helper', t => {
  t.deepEqual([], makeBatches([], 4), 'a')
  t.deepEqual([[1,2,3], [4,5,6], [7,8]], makeBatches([1,2,3,4,5,6,7,8], 3), 'b')
  t.deepEqual([[1,2,3], [4,5,6]], makeBatches([1,2,3,4,5,6], 3), 'c')
  t.deepEqual([[1], [2], [3]], makeBatches([1,2,3], 1), 'd')
  t.end()
})

// TODO: add fake source!
// Can set fake source to crawl localhost:3000/integrationtest, which contains test assets.
// prior to running test, copy those assets there.
// The data should then work fine.
// Always run that fake thing!

// TODO: make it all parallel!


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

async function runTest(key, today) {
  test(`${key} for ${today}`, async t => {
    t.plan(3)
    try {

      const crawlArg = {
        Records: [
          { Sns: { Message: JSON.stringify({source: key}) } }
        ]
      }
      console.log(`Calling scrape for ${key}`)
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
    }
    t.end()
  })
}

const today = datetime.today.utc()
/*
setup()
for (const key of sourceKeys) {
  runTest(key, today)
}
teardown()
*/

// ASYNC VERSION

async function runFullCycle(key, today) {

  const result = {
    key: key,
    crawled: false,
    scraped: false,
    data: null,
    written: false,
    success: false,
    error: null
  }

  try {

    const crawlArg = {
      Records: [
        { Sns: { Message: JSON.stringify({source: key}) } }
      ]
    }
    console.log(`Calling scrape for ${key}`)
    await crawlerHandler(crawlArg)
    result.crawled = true

    const scrapeArg = {
      Records: [
        { Sns: { Message: JSON.stringify({source: key, date: today, silent: true}) } }
      ]
    }
    const data = await scraperHandler(scrapeArg)
    result.scraped = true
    result.data = data

    // TODO (testing) verify that data was actually written.
    result.written = true

    result.success = true
  } catch(err) {
    console.log(`error: ${err}`)
    // I tried 'result.error = err' below, but that did not work: the
    // returned object only contained '"error":{}'.  Changing it to a
    // string preserved the details.  Not ideal, but not terrible.
    result.error = `error: ${err}`
  } finally {
    return result
  }
}

function getInfoForEveryInnerArgument(keys, today) {
  const allruns = keys.map(k => runFullCycle(k, today))
  return Promise.all(allruns)
    .then((results) => {
      return results
    })
}

function mainFunction(batchedKeys, today) {
  return new Promise(function(resolve, reject) {
    var results = []
    var index = 0
    function next() {
      if (index < batchedKeys.length) {
        const currBatch = batchedKeys[index]
        console.log(`Running batch ${index + 1}: ${currBatch.join(',')}`)
        getInfoForEveryInnerArgument(currBatch).then(function(data) {
          results.push(data)
          next()
        }, reject)
        index += 1
      } else {
        resolve(results.flat())
      }
    }
    // start first iteration
    next()
  })
}


/** For debugging only. */
function printResults(results) {
  console.log("Results (minus data):")
  results.forEach(r => {
    console.log('------------------------------')
    let copy = r
    delete copy.data
    console.log(JSON.stringify(copy))
  })
  return results
}

function testResults(results) {
  results.forEach (result => {
    test(`${result.key}`, t => {
      t.ok(result.error === null, `null error "${result.error}"`)
      t.ok(result.success, 'completed successfully')
      t.ok(result.crawled, 'crawled')
      t.ok(result.scraped, 'scraped')
      t.ok(result.data !== null, 'got data')
      t.ok(result.written, 'wrote')
      t.end()
    })
  })
}

const batches = makeBatches(sourceKeys, 2)

mainFunction(batches, today).then(result => testResults(result))

