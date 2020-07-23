const test = require('tape')
const buildTimeseriesV1Report = require('../../../../../src/events/reports-v1/generate-data/_timeseries-v1-json.js')

/** the _timeseries-v1-json function takes baseData.json and converts
 * it to covidatlas.com-compliant timeseries.json. */

// The input.
let baseDataString = null

// The expected output.
let expectedOutputString = null

function assertMatchesExpected (t) {
  const baseData = JSON.parse(baseDataString)
  const actual = buildTimeseriesV1Report(baseData)
  const expected = JSON.parse(expectedOutputString)
  t.deepEqual(actual, expected)
}


test('single record', t => {

  baseDataString = `[
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "dates": {
      "2020-06-15": { "cases": 15 }
    }
  }
]`

  expectedOutputString = `{
  "2020-06-15": {
    "0": { "cases": 15 }
  }
}`

  assertMatchesExpected(t)
  t.end()
})


test('multiple dates single location', t => {

  baseDataString = `[
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "dates": {
      "2020-06-15": { "cases": 15 },
      "2020-06-19": { "deaths": 15 }
    }
  }
]`

  expectedOutputString = `{
  "2020-06-15": {
    "0": { "cases": 15 }
  },
  "2020-06-16": {},
  "2020-06-17": {},
  "2020-06-18": {},
  "2020-06-19": {
    "0": { "deaths": 15 }
  }
}`

  assertMatchesExpected(t)
  t.end()
})


/**
Tests

multiple dates single location
dates with gaps
multiple locations different dates
no timeseries still works
date over year end
*/
