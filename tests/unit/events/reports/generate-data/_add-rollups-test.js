/** _add-rollups tests. */

const test = require('tape')

const src = '../../../../../src/events/reports/generate-data'
const buildTimeseries = require(src + '/_build-timeseries.js')
const addRollups = require(src + '/_add-rollups.js')

/** Data for call to buildTimeseries. */
let records = []

/** Expected response for buildTimeseries(records). */
// let expected = []

/** Print things by locationID (key) */
function printTimeseries (json) {
  const hsh = {}
  Object.keys(json).sort().forEach(k => hsh[k] = json[k])
  console.log(JSON.stringify(hsh, null, 2))
}

test('single lower level rolls up to higher levels if higher level is empty', t => {
  records = [ {
    cases: 10,
    country: 'c1',
    state: 's1',
    county: 'f1',
    locationID: 'c1#s1#f1',
    dateSource: '2020-06-19#src1',
    date: '2020-06-19',
    source: 'src1',
    priority: 1
  } ]
  const actual = addRollups(buildTimeseries(records))

  printTimeseries(actual)

  const expectedKeys = [ 'c1', 'c1#s1', 'c1#s1#f1'  ]
  t.deepEqual(Object.keys(actual).sort(), expectedKeys.sort(), 'location ID')
  for (const k of expectedKeys) {
    t.deepEqual(Object.keys(actual[k].timeseries), [ '2020-06-19' ], `dates for ${k}`)
    t.equal(actual[k].timeseries[ '2020-06-19' ].cases, 10, `cases for ${k}`)
  }
  t.end()
})


/** Make dynamoDB records.  Get country/state/county from locationID. */
function makeRecords (arr) {

  function record (locationID, date, source, caseData) {
    const ret = Object.assign({ locationID, date, source }, caseData)
    ret.dateSource = [ date, source ].join('#')

    const [ country, state, county ] = locationID.split('#')
    if (country) ret.country = country
    if (state) ret.state = state
    if (county) ret.county = county

    return ret
  }
  return arr.map(a => record(...a))
}


/** Compare deterministically-printed timeseries. */
function assertTimeseriesEqual (t, actual, expected, msg = 'timeseries') {
  function toString (json) {
    const hsh = {}
    Object.keys(json).sort().forEach(k => hsh[k] = json[k])
    return JSON.stringify(hsh, null, 2)
  }

  const a = toString(actual)
  const e = toString(expected)

  // Print out results side-by-side.
  if (a !== e) {
    const actualOut = [ 'ACTUAL', '='.repeat(30) ].concat(a.split('\n'))
    const expectedOut = [ 'EXPECTED', '='.repeat(30) ].concat(e.split('\n'))
    while (actualOut.length < expectedOut.length)
      actualOut.push('')
    while (expectedOut.length < actualOut.length)
      expectedOut.push('')

    for (let i = 0; i < actualOut.length; i++) {
      console.log(actualOut[i].padEnd(40, ' ') + expectedOut[i])
    }
  }

  t.equal(a, e, msg)
}


test.only('single record rolls up to parents if parents do not exist', t => {
  records = makeRecords([
    [ 'c1#s1#f1', '2020-06-19', 'src1', { cases: 10 } ]
  ])
  const actual = addRollups(buildTimeseries(records))

  const expectedRecords = makeRecords([
    // Rollup of children
    [ 'c1',       '2020-06-19', 'rollup', { cases: 10 } ],
    // Rollup of children
    [ 'c1#s1',    '2020-06-19', 'rollup', { cases: 10 } ],

    // The source record.
    [ 'c1#s1#f1', '2020-06-19', 'src1',   { cases: 10 } ]
  ])
  const expected = buildTimeseries(expectedRecords)

  assertTimeseriesEqual(t, actual, expected)
  t.end()
})


/*
single location

rollup of two locations to higher level

top level, mid level has data, bottom level also has data ... uses
data from middle.

can even handle city-level data, though that's unusual

two locations with data at different dates rolling up to higher

two locations rolling up to different top level

if higher level data is present, it's left alone

higher has some data but not all (eg has cases but not deaths) gets
data from lower cases (eg for deaths); sources includes 'rollup'

sanity check: higher level only

if no higher level, the lower levels roll up to make the higher level

if higher level exists, and lower levels don't roll up to match the
higher level, print warning

top level has data for some dates, but uses rollup for others

sources say "rollup" for each date where it was a rollup

growth factor should be added after rollups

rolled up item should have growth factor

Full reports can handle "rollup" items
*/


/*
function makeRecords (arr) {
  function record (locationID, date, source, caseData, priority = null) {
    const rec = Object.assign({ locationID, date, source }, caseData)
    if (priority)
      rec.priority = priority
    return rec
  }
  return arr.map(a => record(...a))
}
*/

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
