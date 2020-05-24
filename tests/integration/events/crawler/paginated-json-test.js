process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

const firstPage = {
  records: [
    { date: 'Jan 1', cases: 1 },
    { date: 'Jan 2', cases: 2 }
  ],
  nextUrl: 'http://localhost:5555/tests/fake-source-urls/paginated-json/page2.json'
}

const lastPage = {
  records: [
    { date: 'Jan 3', cases: 3 }
  ]
}

test('crawl saves paginated results to cache as separate files', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)

  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  try {
    await utils.crawl('paginated-json')
    t.pass('crawl succeeded')
  }
  catch (err) {
    t.fail(err)
  }

  t.equal(2, testCache.allFiles().length, 'have both files after crawl.')

  await utils.teardown()
  t.end()
})


test('pagination saves nothing if file is missing', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  // Page 1 refers to missing page 2
  // utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)

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

test.only('paginated files are named correctly', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('paginated-json/page1.json', firstPage)
  utils.writeFakeSourceContent('paginated-json/page2.json', lastPage)

  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  try {
    await utils.crawl('paginated-json')
    t.pass('crawl succeeded')
  }
  catch (err) {
    t.fail(err)
  }

  const cachedFiles = testCache.allFiles()
  t.haveMatchingCacheFile = pattern => {
    const match = cachedFiles.find(f => f.match(pattern))
    t.ok(match, `expected match for ${pattern} in ${cachedFiles.join()}`)
  }
  t.haveMatchingCacheFile(/default-0-/)
  t.haveMatchingCacheFile(/default-1-/)

  await utils.teardown()
  t.end()
})
