process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const { buildBaseJson } = require('../../../../src/scheduled/reports/_build-base-json.js')

test('smoke test report with single record', async t => {
  await utils.setup()
  const initialLocs = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(initialLocs.length, 0, `Should have 0 locations at start of test, but got ${JSON.stringify(initialLocs)}`)

  const caseData = { cases: 10, deaths: 20, tested: 30, hospitalized: 40, icu: 50, date: '2020-05-25' }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  await utils.scrape('json-source')

  // Reports require locations.
  // Scrape creates an event to load location data with
  // arc.events.publish({ name: 'locations', payload: ... }), but that
  // is handled in a separate event queue.  We need to wait until that
  // is processed before we can continue.
  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, 'Sanity check, have 1 location')

  const actual = await buildBaseJson()
  t.equal(actual.length, 1, 'single record in report')

  // Note: don't check the detail, just basic structure. Other tests
  // check dynamoDB writes and timeseries generation.
  const first = actual[0]
  t.ok(first.locationID, 'have location ID')
  t.equal(first.locationID, 'iso1:us#iso2:us-ca#fips:06007')
  t.ok(first.timeseries, 'have timeseries')
  t.ok(first.sources, 'have sources')

  await utils.teardown()
  t.end()
})
