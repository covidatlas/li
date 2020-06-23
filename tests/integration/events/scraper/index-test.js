process.env.NODE_ENV = 'testing'

const arc = require('@architect/functions')
const test = require('tape')
const utils = require('../../_lib/utils.js')
const fs = require('fs')
const path = require('path')
const testCache = utils.testCache


test('scrape extracts data from cached file', async t => {
  await utils.setup()

  const caseData = { cases: 10, deaths: 20, tested: 30, hospitalized: 40, icu: 50 }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('json-source')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  t.equal('iso1:us#iso2:us-ca#fips:06007', result.locationIDs.join(), 'Location IDs')

  const actual = result.data
  t.ok(actual, 'Have data')
  t.equal(1, actual.length, '1 record in returned data')

  // These fields should match exactly.
  // TODO (testing) Add extra fields here so we're sure nothing is lost.
  const expected = {
    ...caseData,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    source: 'json-source',
    priority: 1
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


test('scrape writes to dynamodb', async t => {
  await utils.setup()

  const caseData = { cases: 10, deaths: 20, tested: 30, hospitalized: 40, icu: 50 }
  utils.writeFakeSourceContent('json-source/data.json', caseData)
  await utils.crawl('json-source')
  t.equal(1, testCache.allFiles().length, 'sanity check.')

  const fullResult = await utils.scrape('json-source')
  const result = fullResult[0]
  t.ok(result, 'Have result')

  const tbls = await arc.tables()
  const recs = await tbls['case-data'].scan({})
  t.equal(recs.Items.length, 1, '1 record only')

  const actual = Object.assign({}, recs.Items[0])
  const expected = {
    cases: 10,
    deaths: 20,
    tested: 30,
    hospitalized: 40,
    icu: 50,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    dateSource: '2020-06-19#json-source',
    date: '2020-06-19',
    source: 'json-source',
    priority: 1,
    updated: '2020-06-19T22:51:05.276Z'
  }

  // Only check non-date fields for exact equality.
  const dateKeys = [ 'dateSource', 'date', 'updated' ]

  const actualKeys = Object.keys(actual)

  t.equal(Object.keys(expected).sort().join(), actualKeys.sort().join(), 'contains expected keys')
  actualKeys.filter(f => !dateKeys.includes(f)).forEach(key => {
    t.equal(expected[key], actual[key], key)
  })

  // Scrape creates an event to load location data with
  // arc.events.publish({ name: 'locations', payload: ... }), but that
  // is handled in a separate event queue.  We need to wait until that
  // is processed before we can continue.
  const locations = await utils.waitForDynamoTable('locations', 10000, 200)
  t.equal(locations.length, 1, 'Have 1 location')
  t.equal(recs.Items.length, 1, '1 record only')

  const expectedLoc = {
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    slug: 'butte-county-california-us',
    name: 'Butte County, California, US',
    area: {
      squareMeters: 4348071591,
      landSquareMeters: 4238438186,
      waterSquareMeters: 105311003
    },
    coordinates: [
      -121.6,
      39.67
    ],
    countryID: 'iso1:US',
    countryName: 'United States',
    population: 219186,
    tz: 'America/Los_Angeles',
    level: 'county',
    stateID: 'iso2:US-CA',
    stateName: 'California',
    countyID: 'fips:06007',
    countyName: 'Butte County'
    // created: '2020-06-23T00:10:18.744Z'  // Don't check dates.
  }

  // Don't check dates
  t.match(locations[0].created, /\d{4}-\d{2}-\d{2}T.*/, 'have created date')
  const actualLoc = Object.assign({}, locations[0])
  delete actualLoc.created
  delete actualLoc.updated
  t.deepEqual(actualLoc, expectedLoc, 'dynamoDB Location')

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
