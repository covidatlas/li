process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const testCache = utils.testCache


// NOTE: this test will not work,
// until the corresponding ../crawler/excet-test.js all passes.
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

  const expected = []

  t.equal(JSON.stringify(actual), JSON.stringify(expected))

  await utils.teardown()
  t.end()
})
