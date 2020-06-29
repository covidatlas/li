process.env.NODE_ENV = 'testing'

const utils =  require('../../_lib/utils.js')
const test = require('tape')
const path = require('path')
const testCache = utils.testCache

const firstPage = {
  records: [
    { date: 'Jan 1', cases: 1 },
    { date: 'Jan 2', cases: 2 }
  ],
  nextUrl: 'page2.json'
}

const lastPage = {
  records: [
    { date: 'Jan 3', cases: 3 }
  ]
}

async function doCrawl (t) {
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  try {
    await utils.crawl('paginated-json')
    t.pass('crawl succeeded')
  }
  catch (err) {
    t.fail(err)
  }
}

test('crawl saves paginated results to cache as separate files', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)
  t.equal(3, testCache.allFiles().length, 'all files after crawl.')

  await utils.teardown()
  t.end()
})


test('pagination saves nothing if file is missing', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  // Page 1 refers to missing page 2
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })

  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  try {
    await utils.crawl('paginated-json')
    t.fail('crawl succeeded, should have failed')
  }
  catch (err) {
    t.pass(err)
  }

  t.equal(0, testCache.allFiles().length, 'Still no files.')

  await utils.teardown()
  t.end()
})

test('paginated files are named correctly', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)

  const cachedFiles = testCache.allFiles()
  t.haveMatchingCacheFile = pattern => {
    const match = cachedFiles.find(f => f.match(pattern))
    t.ok(match, `expected match for ${pattern} in ${cachedFiles.join()}`)
  }
  t.haveMatchingCacheFile(/cases-0-/)
  t.haveMatchingCacheFile(/cases-1-/)
  t.haveMatchingCacheFile(/deaths-.{5}.json/)

  await utils.teardown()
  t.end()
})

/** The paginated set of files all get the same datetime stamp at the
 * start of the filename.  This _vastly_ simplifies fetching the files
 * from the cache during scrape. */
test('paginated files in one crawl are all given the same datetime', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)

  const cachedFiles = testCache.allFiles()

  function datetimeStamp (pattern) {
    const f = cachedFiles.find(f => f.match(pattern))
    t.ok(f, `match for ${pattern}`)
    const datetimeLength = 24  // = '2020-05-24t23_39_57.562z'.length
    return path.basename(f).slice(0, datetimeLength)
  }
  t.equal(datetimeStamp(/cases-0-/), datetimeStamp(/cases-1-/), 'timestamps equal')

  await utils.teardown()
  t.end()
})

test('single paginated file still has index', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', lastPage)
  utils.writeFakeSourceContent('paginated-json/deaths.json', { deaths: 5 })
  await doCrawl(t)

  const cachedFiles = testCache.allFiles()
  t.haveMatchingCacheFile = pattern => {
    const match = cachedFiles.find(f => f.match(pattern))
    t.ok(match, `expected match for ${pattern} in ${cachedFiles.join()}`)
  }
  t.haveMatchingCacheFile(/cases-0-/)

  await utils.teardown()
  t.end()
})
