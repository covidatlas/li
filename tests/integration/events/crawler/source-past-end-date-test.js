process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

test('crawl should not save file to cache if source is past end date', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('past-end-date/result.json', { cases: 10, deaths: 20 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('past-end-date')
  t.equal(0, testCache.allFiles().length, 'Still no files in cache.')

  await utils.teardown()
  t.end()
})
