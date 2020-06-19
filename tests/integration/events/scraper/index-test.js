process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../utils.js')
const fs = require('fs')
const path = require('path')
const testCache = require('../../_lib/testcache.js')


test('scrape extracts data from cached file', async t => {
  await utils.setup()

  const caseData = { cases: 10, deaths: 20, tested: 30, hospitalized: 40, icu: 50 }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('json-source')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  t.equal('iso1:us#iso2:us-ca', result.locationIDs.join(), 'Location IDs')

  const actual = result.data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  // These fields should match exactly.
  // TODO (testing) Add extra fields here so we're sure nothing is lost.
  const expected = {
    ...caseData,
    country:
    'iso1:US',
    state: 'iso2:US-CA',
    locationID: 'iso1:us#iso2:us-ca',
    source: 'json-source',
    priority: 0
  }
  Object.keys(expected).forEach(key => {
    t.equal(expected[key], actual[0][key], key)
  })

  // Don't check content of these fields, just ensure that they exist and match pattern.
  const dateFields = [ 'dateSource', 'date', 'updated' ]
  dateFields.forEach(f => {
    const dateRe = /^\d\d\d\d-\d\d-\d\d/
    t.ok(actual[0][f].match(dateRe), `${f} matches ${dateRe}`)
  })

  await utils.teardown()
  t.end()
})


test('cached file does not have to be compressed when working locally', async t => {
  await utils.setup()

  const caseData = { cases: 10, deaths: 20, tested: 30, hospitalized: 40 }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  // Replace the .gz file with a non-gz file, same content.
  const f = path.join(testCache.testingCache, testCache.allFiles()[0])
  t.match(f, /\.gz$/, 'file is .gz')
  fs.unlinkSync(f)

  fs.writeFileSync(f.replace('.gz', ''), JSON.stringify(caseData))
  t.equal(1, testCache.allFiles().length, 'sanity check #2.')

  const fullResult = await utils.scrape('json-source')
  utils.validateResults(t, fullResult, [ caseData ] )

  await utils.teardown()
  t.end()
})
