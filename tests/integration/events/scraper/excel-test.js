process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const testCache = utils.testCache


test('can scrape Excel', async t => {
  await utils.setup()

  utils.copyFixture('excel-source/excel-data.xlsx', 'excel-data.xlsx')
  await utils.crawl('excel-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('excel-source')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  const actual = result.data
  t.ok(actual, 'Have data')

  // The test scraper returns extra fields, only use those ones.
  const prunedActual = actual.map(d => {
    return {
      Location: d.Location,
      Date: d.Date,
      Count: d.Count,
      type: d.type
    }
  })
  const expected = [
    { Location: 'A', Date: '2020-08-01', Count: '11', type: 'cases' },
    { Location: 'B', Date: '2020-08-01', Count: '1', type: 'cases' },
    { Location: 'A', Date: '2020-08-02', Count: '22', type: 'cases' },
    { Location: 'B', Date: '2020-08-02', Count: '2', type: 'cases' },
    { Location: 'A', Date: '2020-08-01', Count: '0', type: 'deaths' },
    { Location: 'B', Date: '2020-08-01', Count: '1', type: 'deaths' },
    { Location: 'A', Date: '2020-08-02', Count: '2', type: 'deaths' },
    { Location: 'B', Date: '2020-08-02', Count: '3', type: 'deaths' }
  ]

  t.equal(JSON.stringify(prunedActual), JSON.stringify(expected))

  await utils.teardown()
  t.end()
})
