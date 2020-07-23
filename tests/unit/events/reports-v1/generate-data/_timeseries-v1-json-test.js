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


test('multiple locations', t => {

  baseDataString = `[
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "dates": {
      "2020-06-15": { "cases": 15 },
      "2020-06-19": { "deaths": 15 }
    }
  },
  {
    "locationID": "loc2",
    "dates": {
      "2020-06-21": { "cases": 222 }
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
  },
  "2020-06-20": {},
  "2020-06-21": {
    "1": { "cases": 222 }
  }
}`

  assertMatchesExpected(t)
  t.end()
})


test('location ignored if no dates', t => {

  baseDataString = `[
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "dates": {
      "2020-06-15": { "cases": 15 },
      "2020-06-19": { "deaths": 15 }
    }
  },
  {
    "locationID": "loc2"
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


test('date range works over year end', t => {

  baseDataString = `[
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "dates": {
      "2020-12-29": { "cases": 15 },
      "2021-01-02": { "deaths": 15 }
    }
  }
]`

  expectedOutputString = `{
  "2020-12-29": {
    "0": { "cases": 15 }
  },
  "2020-12-30": {},
  "2020-12-31": {},
  "2021-01-01": {},
  "2021-01-02": {
    "0": { "deaths": 15 }
  }
}`

  assertMatchesExpected(t)
  t.end()
})
