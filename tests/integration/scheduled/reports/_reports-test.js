process.env.NODE_ENV = 'testing'

const test = require('tape')
const utils = require('../../_lib/utils.js')
const { buildBaseJson } = require('../../../../src/scheduled/reports/_build-base-json.js')
const reports = require('../../../../src/scheduled/reports/_reports.js')

const path = require('path')
const intDir = path.join(process.cwd(), 'tests', 'integration')

 /** Fake sources used by the tests. */
const sourcesPath = path.join(intDir, 'fake-sources')


function dumpJson (title, json) {
  console.log('-------------------------------------------------------')
  console.log(title)
  const j = JSON.stringify(json, null, 2).
        split('\n').
        // Substack tape or the postprocessing hides lines that have '..';
        // hacking around to get it to show up.
        map(s => s.replace('..', ' .. ')).
        join('\n')
  console.log(j)
}


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

  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, `Sanity check, have 1 location: ${JSON.stringify(locations, null, 2)}`)

  const base = await buildBaseJson()
  dumpJson('base', base)

  // Override load path for sources, since we're using fake sources
  // for these tests.
  const params = { _sourcesPath: sourcesPath }
  dumpJson('locations', await reports.locations(base, params))
  dumpJson('timeseries-byLocation', await reports.timeseriesByLocation(base, params))

  await utils.teardown()
  t.end()
})
