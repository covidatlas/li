const path = require('path')
const fs = require('fs')
const test = require('tape')

const srcShared = path.join(process.cwd(), 'src', 'shared')
const datetime = require(path.join(srcShared, 'datetime', 'index.js'))
const sourceMap = require(path.join(srcShared, 'sources', '_lib', 'source-map.js'))
const changedSources = require(path.join(__dirname, '_lib', 'changed-sources.js'))

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


/** Split an array into batches.
 * e.g.:
 * makeBatches([1,2,3,4,5,6,7,8]) = [[1,2,3], [4,5,6], [7,8]]
 */
function makeBatches(arr, batchsize) {
  const ret = []
  for (let i = 0; i < arr.length; i += batchsize)
    ret.push(arr.slice(i, i + batchsize))
  return ret
}


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
  }

  return result
}

function promiseRunFullCycleFor(keys, today) {
  const allruns = keys.map(k => runFullCycle(k, today))
  return Promise.all(allruns)
}

function mainFunction(maintest, batchedKeys, today) {
  return new Promise(resolve => {
    var allResults = []
    var index = 0
    function next() {
      if (index < batchedKeys.length) {
        const batch = batchedKeys[index]
        const comment = `Running ${batch.join(', ')} (batch ${index + 1} of ${batchedKeys.length})`
        maintest.comment(comment)
        promiseRunFullCycleFor(batch, today).
          then(results => {
            allResults = allResults.concat(results)
            next()
          })
        index += 1
      } else {
        resolve(allResults)
      }
    }
    // start first iteration
    next()
  })
}

/** For debugging only. */
// eslint-disable-next-line no-unused-vars
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

function testResults(maintest, results) {
  results.forEach (result => {
    maintest.test(`source: ${result.key}`, t => {
      t.ok(result.error === null, `null error "${result.error}"`)
      t.ok(result.success, 'completed successfully')
      t.ok(result.crawled, 'crawled')
      t.ok(result.scraped, 'scraped')
      t.ok(result.data !== null, 'got data')
      t.ok(result.written, 'wrote')
      t.end()
    })
  })
  return results
}

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


setup()
test('new or changed sources', async maintest => {
  const today = datetime.today.utc()
  const batches = makeBatches(sourceKeys, 2)
  mainFunction(maintest, batches, today).
    then(result => { console.log(`Got ${result.length} results!`); return result }).
    then(result => testResults(maintest, result))
})
teardown()

// TODO (testing) Add fake source that crawls localhost:3000/integrationtest
// Prior to running test, copy test assets there.
// Fake source can scrape data like a real scraper, easy and controlled.
