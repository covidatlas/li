process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const path = require('path')
const testCache = utils.testCache


test('scrape gets data from named parameter', async t => {
  await utils.setup()

  const caseData = { count: 10 }
  utils.writeFakeSourceContent('single-crawl-with-name/data.json', caseData)
  await utils.crawl('single-crawl-with-name')
  t.equal(1, testCache.allFiles().length, 'sanity check.')
  const cacheFileName = testCache.allFiles()[0].split(path.sep).slice(-1)[0]
  t.match(cacheFileName, /-cases-/, 'filename should contain cases')

  const fullResult = await utils.scrape('single-crawl-with-name')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  const actual = result.data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  // These fields should match exactly.
  const expected = {
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    source: 'single-crawl-with-name',
    cases: 10,
    priority: 1
  }
  Object.keys(expected).forEach(key => {
    t.equal(expected[key], actual[0][key], key)
  })

  await utils.teardown()
  t.end()
})
