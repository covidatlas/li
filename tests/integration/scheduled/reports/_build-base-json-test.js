process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const { buildBaseJson } = require('../../../../src/scheduled/reports/_build-base-json.js')

test('smoke test report with single location', async t => {
  await utils.setup()

  // Generated report should contain these dates:
  const expectedDates = []

  for (var i = 21; i <= 22; ++i) {
    const date = '2020-05-' + i
    expectedDates.push(date)

    const caseData = {
      cases: i,
      deaths: Math.floor(i / 5),
      tested: i * 10,
      hospitalized: i % 5,
      icu: Math.floor(i / 2),
      date
    }
    utils.writeFakeSourceContent('json-source/data.json', caseData)
    await utils.crawl('json-source')
    await utils.scrape('json-source')
  }

  // Reports require locations.
  // Scrape creates an event to load location data with
  // arc.events.publish({ name: 'locations', payload: ... }), but that
  // is handled in a separate event queue.  We need to wait until that
  // is processed before we can continue.
  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, `Sanity check, have 1 location: ${JSON.stringify(locations, null, 2)}`)
  const caseData = await utils.waitForDynamoTable('case-data', 10000, 200)
  t.equal(caseData.length, 2, `Sanity check, have 2 case records: ${JSON.stringify(caseData, null, 2)}`)

  const actual = await buildBaseJson()
  t.equal(actual.length, 1, 'single record in report')

  const j = JSON.stringify(actual, null, 2).
        split('\n').
        // Substack tape or the postprocessing hides lines that have '..' --
        // hacking around to get it to show up.
        map(s => s.replace('2020-05-21..2020-05-22', '2020-05-21 .. 2020-05-22')).
        join('\n')
  console.log(j)

  // Note: don't check the detail, just basic structure. Other tests
  // check dynamoDB writes and timeseries generation.
  const first = actual[0]
  t.ok(first.locationID, 'have location ID')
  t.equal(first.locationID, 'iso1:us#iso2:us-ca#fips:06007')
  t.ok(first.timeseries, 'have timeseries key')
  t.equal(expectedDates.sort().join(), Object.keys(first.timeseries).sort().join(), 'all timeseries dates present')
  t.ok(first.timeseriesSources, 'have timeseriesSources key')
  t.ok(Object.keys(first.timeseriesSources).length > 0, `have timeseriesSources keys`)
  t.equal(first.sources.length, 1, 'have 1 source')
  t.equal(first.sources.join(), 'json-source')

  await utils.teardown()
  t.end()
})
