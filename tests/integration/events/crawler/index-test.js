process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

test('crawl saves files to cache', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('json-source/data.json', { cases: 10, deaths: 20 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('json-source')
  t.equal(1, testCache.allFiles().length, 'have file after crawl.')

  await utils.teardown()
  t.end()
})
