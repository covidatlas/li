/** _build-timeseries tests.
 *
 * _multivalent-record-test.js covers tests for building the detailed
 * records, so these tests check overall structure and combinations.
 *
 */

const test = require('tape')

const { join } = require('path')
const sut = join(process.cwd(), 'src', 'events', 'reports', 'generate-data', '_build-timeseries.js')
const buildTimeseries = require(sut)

/** Data for call to buildTimeseries. */
let records = []

/** Expected response for buildTimeseries(records). */
let expected = []

test('single record builds single timeseries', t => {
  records = [ {
    cases: 10,
    country: 'iso1:US',
    state: 'iso2:US-CA',
    county: 'fips:06007',
    locationID: 'iso1:us#iso2:us-ca#fips:06007',
    dateSource: '2020-06-19#json-source',
    date: '2020-06-19',
    source: 'src1',
    priority: 1
  } ]
  const actual = buildTimeseries(records)
  t.deepEqual(Object.keys(actual), [ 'iso1:us#iso2:us-ca#fips:06007' ], 'location ID')
  t.deepEqual(Object.keys(actual['iso1:us#iso2:us-ca#fips:06007'].timeseries), [ '2020-06-19' ], 'dates')
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
    [ 'loc1', '2020-06-19', 'src1', { cases: 10 } ],
    [ 'loc1', '2020-06-20', 'src1', { cases: 20 } ]
  ])

  const actual = buildTimeseries(records)
  t.deepEqual(Object.keys(actual), [ 'loc1' ], 'location ID')
  t.deepEqual(Object.keys(actual.loc1.timeseries), [ '2020-06-19', '2020-06-20' ], 'dates')
  t.end()
})

test('multiple locations', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 10 } ],
    [ 'loc1', '2020-06-20', 'src1', { cases: 20 } ],
    [ 'loc2', '2020-06-19', 'src1', { cases: 10 } ]
  ])

  const actual = buildTimeseries(records)
  t.deepEqual(Object.keys(actual), [ 'loc1', 'loc2' ], 'location ID')
  t.deepEqual(Object.keys(actual.loc1.timeseries), [ '2020-06-19', '2020-06-20' ], 'loc1 dates')
  t.deepEqual(Object.keys(actual.loc2.timeseries), [ '2020-06-19' ], 'loc2 dates')
  t.end()
})


test('sanity check, multiple data points', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 3 }, 1 ],
    [ 'loc1', '2020-06-19', 'src2', { cases: 2, deaths: 22 }, 1 ],
    [ 'loc1', '2020-06-19', 'src3', { cases: 1, deaths: 11, tested: 111 }, 1 ],
    [ 'loc1', '2020-06-20', 'src1', { cases: 1002, deaths: 1022 }, 1 ],
    [ 'loc1', '2020-06-20', 'src2', { cases: 1001, deaths: 2222, tested: 1111 }, 1 ],
  ])

  const actual = buildTimeseries(records)
  t.deepEqual(Object.keys(actual), [ 'loc1' ], 'location ID')
  t.deepEqual(Object.keys(actual.loc1.timeseries), [ '2020-06-19', '2020-06-20' ], 'dates')
  t.end()
})


test('timeseries fails if missing required fields in any record', t => {

  const minimalRecord = {
    locationID: 'loc1',
    date: '2020-06-19',
    source: 's',
    cases: 11
  }

  try {
    buildTimeseries([ minimalRecord ])
    t.pass('built successfully with minimal record')
  }
  catch (err) {
    t.fail('should have worked, but got ' + err.message)
  }

  [ 'locationID', 'date', 'source' ].forEach(k => {
    const insufficient = Object.assign({}, minimalRecord)
    delete insufficient[k]
    const re = new RegExp(`1 records missing one or more fields locationID, date, source`)
    t.throws(() => buildTimeseries([ insufficient ]), re, `throws when record is missing ${k}`)
  })

  t.end()
})


/**
 * "Collapsing source" tests.
 *
 * When the same source is used multiple times for successive dates,
 * they're 'collapsed' in the sources field of the results.
 */

test('combined data sources collapse correctly', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-17', 'src1', { cases: 1 } ],
    [ 'loc1', '2020-06-18', 'src1', { cases: 1 } ],

    [ 'loc1', '2020-06-19', 'src1', { cases: 1 } ],
    [ 'loc1', '2020-06-19', 'src2', { deaths: 11 } ],
    [ 'loc1', '2020-06-19', 'src3', { tested: 111 } ],

    [ 'loc1', '2020-06-20', 'src1', { cases: 2 } ],
    [ 'loc1', '2020-06-20', 'src2', { deaths: 22 } ],
    [ 'loc1', '2020-06-20', 'src3', { tested: 222 } ],

    [ 'loc1', '2020-06-21', 'src1', { cases: 3 } ],
    [ 'loc1', '2020-06-21', 'src2', { deaths: 33 } ],
    [ 'loc1', '2020-06-21', 'src3', { tested: 333 } ],

    [ 'loc1', '2020-06-22', 'src3', { tested: 444 } ],
    [ 'loc1', '2020-06-23', 'src3', { tested: 555 } ],
  ])

  const expected = {
    '2020-06-17..2020-06-18': 'src1',
    '2020-06-19..2020-06-21': { src1: [ 'cases' ], src2: [ 'deaths' ], src3: [ 'tested' ] },
    '2020-06-22..2020-06-23': 'src3'
  }

  const actual = buildTimeseries(records)
  t.deepEqual(actual.loc1.timeseriesSources, expected, 'timeseriesSources')
  t.end()
})


/** This isn't a real test, it's just verifying current behaviour.  If
 * this test fails, perhaps something in report generation will need
 * to be adjusted. */
test('characterization test: no case data', t => {
  records = [ { locationID: 'loc1', date: '2020-06-19', source: 's' } ]

  expected = {
    loc1: {
      timeseries: { '2020-06-19': {} },
      timeseriesSources: { '2020-06-19': {} },
      sources: []
    }
  }

  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
  t.end()
})


test('sanity check, empty recordset does not throw', t => {
  records = []
  expected = {}
  const actual = buildTimeseries(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
  t.end()
})



/*
TODO (reports) Rollup tests (separate module)
if higher level is present, it's left alone
if no higher level, the lower levels roll up to make the higher level
if higher level exists, and lower levels don't roll up to match the higher level, print warning
*/
