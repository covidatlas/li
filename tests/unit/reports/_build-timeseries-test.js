const test = require('tape')

const { join } = require('path')
const sut = join(process.cwd(), 'src', 'scheduled', 'reports', '_build-timeseries.js')
const buildTimeseries = require(sut)


test.only('single record builds single timeseries', t => {

  const record = {
    cases: 10,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    dateSource: '2020-06-19#json-source',
    date: '2020-06-19',
    source: 'json-source',
    priority: 1
  }
  const records = [ record ]

  const expected = [
    {
      locationID: 'iso1:us#iso2:us-ca#fips:06007',
      timeseries: {
        '2020-06-19': {
          cases: 10
        }
      }
    }
  ]

  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
  t.end()
})

/*
Tests:
multiple dates
multiple sources are combined if fields don't overlap
higher priority source overwrites same field of lower
if equal priority and field values are equal, that's ok - pick any one
if equal priority and field vals are not equal, print a warning (in the same report)

Rollup tests (separate module)
if higher level is present, it's left alone
if no higher level, the lower levels roll up to make the higher level
if higher level exists, and lower levels don't roll up to match the higher level, print warning
*/
