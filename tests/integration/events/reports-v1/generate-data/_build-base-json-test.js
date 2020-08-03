process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../../_lib/utils.js')
const getBaseJson = require('../../../../../src/events/reports-v1/generate-data/_build-base-json.js')

/** Fake sources used by the tests. */
const path = require('path')
const intDir = path.join(process.cwd(), 'tests', 'integration')
const sourcesPath = path.join(intDir, 'fake-sources')

test('smoke test report with single location', async t => {
  await utils.setup()

  const date = '2020-05-21'
  const content = {
    cases: 21,
      deaths: 4,
      tested: 210,
      hospitalized: 1,
      icu: 10,
      date
    }
  utils.writeFakeSourceContent('json-source/data.json', content)
  await utils.crawl('json-source')
  await utils.scrape('json-source')

  // Reports require locations.
  // Scrape creates an event to load location data with
  // arc.events.publish({ name: 'locations', payload: ... }), but that
  // is handled in a separate event queue.  We need to wait until that
  // is processed before we can continue.
  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, `Sanity check, have 1 location: ${JSON.stringify(locations, null, 2)}`)
  const caseData = await utils.waitForDynamoTable('case-data', 10000, 200)
  t.equal(caseData.length, 1, `Sanity check, have 1 case records: ${JSON.stringify(caseData, null, 2)}`)

  const statusUpdates = []
  function updateStatus (index, total) {
    statusUpdates.push(`${index} of ${total}`)
  }

  const params = { _sourcesPath: sourcesPath }
  const actual = await getBaseJson(params, updateStatus)

  t.deepEqual(statusUpdates, [ '0 of 1' ], 'location status updates sent')

  // eslint-disable-next-line
  const expected = require('./expected.json')
  t.deepEqual(expected, actual, 'validate json')

  await utils.teardown()
  t.end()
})
