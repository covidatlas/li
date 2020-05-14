process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

test('crawl saves files to cache', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('fake/fake.json', { cases: 10, deaths: 20 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('fake')
  t.equal(1, testCache.allFiles().length, 'have file after crawl.')

  await utils.teardown()
  t.end()
})
