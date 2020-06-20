const test = require('tape')

const { join } = require('path')
const sut = join(process.cwd(), 'src', 'scheduled', 'reports', '_build-timeseries.js')
const buildTimeseries = require(sut)

// Sample locations.
const loc1 = 'iso1:us#iso2:us-ca#fips:06007'
const loc2 = 'iso1:us#iso2:us-ca#fips:06008'

test('single record builds single timeseries', t => {

  const record = {
    cases: 10,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: loc1,
    dateSource: '2020-06-19#json-source',
    date: '2020-06-19',
    source: 'us-ca-kings-county',
    priority: 1
  }
  const records = [ record ]

  const expected = [
    {
      locationID: loc1,
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


function makeRecords (arr) {
  function record (locationID, date, source, caseData, priority = null) {
    const rec = Object.assign({ locationID, date, source }, caseData)
    if (priority)
      rec.priority = priority
    return rec
  }
  return arr.map(a => record(...a))
}

test('two dates from single source', t => {

  const records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-20', 'src1', { cases: 20 } ]
  ])

  const expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10 },
        '2020-06-20': { cases: 20 }
      }
    }
  ]

  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
  t.end()
})

test('multiple locations', t => {

  const records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-20', 'src1', { cases: 20 } ],
    [ loc2, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc2, '2020-06-20', 'src1', { deaths: 20 } ]
  ])

  const expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10 },
        '2020-06-20': { cases: 20 }
      }
    },
    {
      locationID: loc2,
      timeseries: {
        '2020-06-19': { cases: 10 },
        '2020-06-20': { deaths: 20 }
      }
    }
  ]

  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
  t.end()
})

/*
Tests:
multiple sources are combined if fields don't overlap
higher priority source overwrites same field of lower
missing priority is assumed to be priority 0
if equal priority and field values are equal, that's ok - pick any one
multiple entries from same source on same date (should never happen)
if equal priority and field vals are not equal, print a warning (in the same report)
no case data adds a warning?
*/

test('timeseries fails if missing required fields in any record', t => {

  const minimalRecord = {
    locationID: loc1,
    date: '2020-06-19',
    source: 's'
  }

  t.ok(buildTimeseries([ minimalRecord ]), 'can build with minimal record')

  Object.keys(minimalRecord).forEach(k => {
    const insufficient = Object.assign({}, minimalRecord)
    delete insufficient[k]
    const re = new RegExp(`1 records missing one or more fields locationID, date, source`)
    t.throws(() => buildTimeseries([ insufficient ]), re)
  })

  t.end()
})


/*
Rollup tests (separate module)
if higher level is present, it's left alone
if no higher level, the lower levels roll up to make the higher level
if higher level exists, and lower levels don't roll up to match the higher level, print warning
*/
