process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

test('crawl saves paginated results to cache as separate files', async t => {
  await utils.setup()

  const page1 = {
    date: 'Jan 1',
    cases: 1,
    nextUrl: 'http://localhost:5555/tests/fake-source-urls/paginated-json/page2.json'
  }
  const page2 = {
    date: 'Jan 2',
    cases: 2
  }
  utils.writeFakeSourceContent('paginated-json/page1.json', page1)
  utils.writeFakeSourceContent('paginated-json/page2.json', page2)

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

// TODO tests
// Files are named correctly
// missing page = nothing is saved
