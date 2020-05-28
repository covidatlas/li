process.env.NODE_ENV = 'testing'

const test = require('tape')
const fs = require('fs')
const path = require('path')
const utils = require('../utils.js')
const testCache = require('../../_lib/testcache.js')


test('scrape of multiple files', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('multiple-urls/cases.json', { count: 111 })
  utils.writeFakeSourceContent('multiple-urls/deaths.json', { count: 222 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('multiple-urls')
  t.equal(2, testCache.allFiles().length, '2 files saved after crawl.')

  const fullResult = await utils.scrape('multiple-urls')
  utils.validateResults(t, fullResult, [ { cases: 111, deaths: 222 } ])

  await utils.teardown()
  t.end()
})

test('scrape fails if files missing', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('multiple-urls/cases.json', { count: 111 })
  utils.writeFakeSourceContent('multiple-urls/deaths.json', { count: 222 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('multiple-urls')
  t.equal(2, testCache.allFiles().length, '2 files saved after crawl.')

  const f = testCache.allFiles()[0]
  fs.unlinkSync(path.join(testCache.testingCache, f))

  try {
    await utils.scrape('multiple-urls')
    t.fail('should have failed')
  }
  catch (err) {
    t.match(err.message, /Could not load cache/)
  }

  await utils.teardown()
  t.end()
})

test('scrape fails if cache files are corrupted', async t => {
  await utils.setup()

  utils.writeFakeSourceContent('multiple-urls/cases.json', { count: 111 })
  utils.writeFakeSourceContent('multiple-urls/deaths.json', { count: 222 })
  t.equal(0, testCache.allFiles().length, 'No files in cache.')
  await utils.crawl('multiple-urls')
  t.equal(2, testCache.allFiles().length, '2 files saved after crawl.')

  const f = path.join(testCache.testingCache, testCache.allFiles()[0])
  fs.unlinkSync(f)
  fs.writeFileSync(f, 'This is not json and it should fail parsing.')

  try {
    await utils.scrape('multiple-urls')
    t.fail('should have failed')
  }
  catch (err) {
    t.pass('failed with error: ' + err)
  }

  await utils.teardown()
  t.end()
})
