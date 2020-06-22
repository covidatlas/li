process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const testCache = utils.testCache


// TODO (testing): ensure CSV file actually has real BOM char, and is on a case data field.

// Currently, the csv fixture file has "ï»¿OBJECTID,cases,deaths", but
// we're not even using the first field.  A more interesting test
// would be "ï»¿cases,deaths", b/c that changes the field name and can
// confuse scrapers.
//
// This test is still a good base.
test('csv parser can handle BOM in file', async t => {
  await utils.setup()

  utils.copyFixture('csv-source/data.csv', 'csv_with_BOM.csv')
  await utils.crawl('csv-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('csv-source')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  const actual = result.data
  t.ok(actual, 'Have data')
  const caseDataActual = actual.map(a => { return { cases: a.cases, deaths: a.deaths } })

  const expected = [ { cases: '1', deaths: '2' } ]

  t.equal(JSON.stringify(caseDataActual), JSON.stringify(expected))

  await utils.teardown()
  t.end()
})
