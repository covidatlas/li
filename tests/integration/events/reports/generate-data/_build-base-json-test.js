process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../../_lib/utils.js')
const getBaseJson = require('../../../../../src/events/reports/generate-data/_build-base-json.js')

/** Fake sources used by the tests. */
const path = require('path')
const intDir = path.join(process.cwd(), 'tests', 'integration')
const sourcesPath = path.join(intDir, 'fake-sources')

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

  const statusUpdates = []
  function updateStatus (index, total) {
    statusUpdates.push(`${index} of ${total}`)
  }

  const params = { _sourcesPath: sourcesPath }
  const actual = await getBaseJson(params, updateStatus)

  t.deepEqual(statusUpdates, [ '0 of 1' ], 'location status updates sent')

  // Generated json has timestamps in it which is not deterministic,
  // replace with generic tokens.
  function clean (h, debugTitle) {
    const s = JSON.stringify(h, null, 2).
          replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '__DATETIME__').
          replace(/\.\./g, ' .. ')  // Required, or tape hides the lines!

    if (debugTitle)
      [ debugTitle, '============', s ].forEach(x => console.log(x))

    return s
  }
  // eslint-disable-next-line
  const expected = require('./expected.json')
  t.equal(clean(expected), clean(actual, 'ACTUAL'), 'validate json')

  await utils.teardown()
  t.end()
})
