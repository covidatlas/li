const test = require('tape')

const { join } = require('path')
const sut = join(process.cwd(), 'src', 'scheduled', 'reports', '_build-timeseries.js')
const buildTimeseries = require(sut)

/** Sample locations. */
const loc1 = 'iso1:us#iso2:us-ca#fips:06007'
const loc2 = 'iso1:us#iso2:us-ca#fips:06008'

/** Data for call to buildTimeseries. */
let records = []

/** Expected response for buildTimeseries(records). */
let expected = []

/** Build timeseries for records, compare with expected. */
function validateTimeseries (t) {
  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
}

test('single record builds single timeseries', t => {
  records = [ {
    cases: 10,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: loc1,
    dateSource: '2020-06-19#json-source',
    date: '2020-06-19',
    source: 'us-ca-kings-county',
    priority: 1
  } ]

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10 }
      }
    }
  ]

  validateTimeseries(t)
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
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-20', 'src1', { cases: 20 } ]
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10 },
        '2020-06-20': { cases: 20 }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('multiple locations', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-20', 'src1', { cases: 20 } ],
    [ loc2, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc2, '2020-06-20', 'src1', { deaths: 20 } ]
  ])

  expected = [
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

  validateTimeseries(t)
  t.end()
})

test('data from multiple sources are combined if fields are distinct', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-19', 'src2', { deaths: 20 } ]
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10, deaths: 20 }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('data from multiple sources are combined if fields are distinct', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 10 } ],
    [ loc1, '2020-06-19', 'src2', { deaths: 20 } ]
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10, deaths: 20 }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('higher priority source overwrites lower priority source', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src2', { cases: 2222, deaths: 2222 }, 1 ],
    [ loc1, '2020-06-19', 'src1', { cases: 1 } ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 2222, deaths: 2222 }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('two sources with same priority and same value is ok, chooses later one', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src2', { cases: 1, deaths: 2222 }, 1 ],
    [ loc1, '2020-06-19', 'src1', { cases: 1 }, 1 ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 1, deaths: 2222 }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

/*
Tests:
multiple entries from same source on same date is ok (should never happen)
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
