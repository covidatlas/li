process.env.NODE_ENV = 'testing'

const utils = require('../utils.js')
const test = require('tape')
const testCache = require('../../_lib/testcache.js')

test('successful crawl saves multiple files to cache', async t => {
  await utils.setup()
  t.plan(2)

  utils.writeFakeSourceContent('multiple-urls/cases.json', { number: 111 })
  utils.writeFakeSourceContent('multiple-urls/deaths.json', { number: 222 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('multiple-urls')
  t.equal(2, testCache.allFiles().length, '2 files saved after crawl.')

  await utils.teardown()
  t.end()
})

test('nothing saved to cache if one urls fails', async t => {
  await utils.setup()
  t.plan(3)

  utils.writeFakeSourceContent('multiple-urls/cases.json', { number: 111 })
  // 'deaths.json' not written.
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  try {
    await utils.crawl('multiple-urls')
    t.fail('should have thrown')
  }
  catch (err) {
    t.pass('Err thrown')
  }
  t.equal(0, testCache.allFiles().length, 'Still no files in cache.')

  await utils.teardown()
  t.end()
})
