process.env.NODE_ENV = 'testing'

const sandbox = require('@architect/sandbox')
const test = require('tape')
const { join } = require('path')
const intDir = join(process.cwd(), 'tests', 'integration')
const testCache = require(join(intDir, '_lib', 'testcache.js'))
const fakeCrawlSites = require(join(intDir, '_lib', 'fake-crawl-sites.js'))
const crawlerHandler = require(join(process.cwd(), 'src', 'events', 'crawler', 'index.js')).handler
const scraperHandler = require(join(process.cwd(), 'src', 'events', 'scraper', 'index.js')).handler

/** Create AWS event payload for the crawl/scrape handlers. */
function makeEventMessage (hsh) {
  return { Records: [ { Sns: { Message: JSON.stringify(hsh) } } ] }
}

test('scrape extracts data from cached file', async t => {
  await sandbox.start({ port: 5555, quiet: true })

  t.plan(9)

  const sourcesPath = join(intDir, 'fake-sources')

  const rawData = { cases: 10, deaths: 20 }
  fakeCrawlSites.writeFile('fake', 'fake.json', JSON.stringify(rawData))

  testCache.setup()
  const event = makeEventMessage({ source: 'fake', _sourcesPath: sourcesPath })
  await crawlerHandler(event)
  t.equal(1, testCache.allFiles().length, 'Sanity check, have data to scrape.')

  const fullResult = await scraperHandler(event)
  const result = fullResult[0]
  t.ok(result, 'Have result')

  t.equal('iso1:us#iso2:us-ca', result.locationIDs.join(), 'Location IDs')

  const actual = result.data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  // These fields should match exactly.
  // TODO (testing) Add extra fields here so we're sure nothing is lost.
  const expected = {
    cases: 10,
    deaths: 20,
    country:
    'iso1:US',
    state: 'iso2:US-CA',
    locationID: 'iso1:us#iso2:us-ca',
    source: 'fake',
    priority: 0
  }
  const prunedActual = Object.keys(expected).reduce((hsh, key) => {
    hsh[key] = actual[0][key]
    return hsh
  }, {})
  t.deepEqual(expected, prunedActual, 'exact key matches')

  // Don't check content of these fields, just ensure that they exist and match pattern.
  const dateFields = [ 'dateSource', 'date', 'updated' ]
  dateFields.forEach(f => {
    const dateRe = /^\d\d\d\d-\d\d-\d\d/
    t.ok(actual[0][f].match(dateRe), `${f} matches ${dateRe}`)
  })

  testCache.teardown()
  await sandbox.end()
})
