/** _add-rollups tests. */

const test = require('tape')

const src = '../../../../../src/events/reports/generate-data'
const buildTimeseries = require(src + '/_build-timeseries.js')
const addRollups = require(src + '/_add-rollups.js')

/** Data for call to buildTimeseries. */
let records = []

/** Expected response for buildTimeseries(records). */
let expected = []

test('lower levels roll up to higher levels if higher levels are empty', t => {
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
  const actual = addRollups(buildTimeseries(records))

  console.log(JSON.stringify(actual, null, 2))
  const expectedKeys = [ 'iso1:us', 'iso1:us#iso2:us-ca', 'iso1:us#iso2:us-ca#fips:06007'  ]
  t.deepEqual(Object.keys(actual).sort(), expectedKeys.sort(), 'location ID')
  for (const k of expectedKeys) {
    t.deepEqual(Object.keys(actual[k].timeseries), [ '2020-06-19' ], `dates for ${k}`)
    t.equal(actual[k].timeseries[ '2020-06-19' ].cases, 10, `cases for ${k}`)
  }
  t.end()
})


/*
single location
rollup of two locations to higher level

top level, mid level has data, bottom level also has data ... uses data from middle.

can even handle city-level data, though that's unusual

if higher level data is present, it's left alone
higher has some data but not all (eg has cases but not deaths) gets data from lower cases (eg for deaths)
sanity check: higher level only
if no higher level, the lower levels roll up to make the higher level
if higher level exists, and lower levels don't roll up to match the higher level, print warning
sources say "rollup" for each date where it was a rollup
growth factor should be added after rollups
rolled up item should have growth factor

Full reports can handle "rollup" items
*/


function makeRecords (arr) {
  function record (locationID, date, source, caseData, priority = null) {
    const rec = Object.assign({ locationID, date, source }, caseData)
    if (priority)
      rec.priority = priority
    return rec
  }
  return arr.map(a => record(...a))
}

/*

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

*/



/** This isn't a real test, it's just verifying current behaviour.  If
 * this test fails, perhaps something in report generation will need
 * to be adjusted. */
/*
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
*/
