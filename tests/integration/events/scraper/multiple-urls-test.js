process.env.NODE_ENV = 'testing'

const test = require('tape')
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
  const actual = fullResult[0].data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  const expected = { cases: 111, deaths: 222 }
  const prunedActual = Object.keys(expected).reduce((hsh, key) => {
    hsh[key] = actual[0][key]
    return hsh
  }, {})
  t.deepEqual(expected, prunedActual, 'exact key matches')

  await utils.teardown()
  t.end()
})
