const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'events', 'reports', 'generate-data', '_multivalent-record.js')
const createMultivalentRecord = require(sut)


/** Data for call to createMultivalentRecord. */
let records = []

/** Expected response for createMultivalentRecord(records). */
let expected = {}

/** Build multivalent record for records, compare with expected. */
function validate (t) {
  let actual = createMultivalentRecord(records)
  t.equal(JSON.stringify(actual), JSON.stringify(expected))
}

test('single record builds single record', t => {
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

  expected = {
    data: { cases: 10 },
    warnings: {},
    dateSources: 'src1',
    sources: [ 'src1' ]
  }

  validate(t)
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

test('all records must have the same date', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 10 } ],
    [ 'loc1', '2020-06-20', 'src1', { cases: 20 } ]
  ])
  const re = /can only be created from records with same date/
  t.throws(() => createMultivalentRecord(records), re, 'throws when dates are different')
  t.end()
})

test('multiple locations throws', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 10 } ],
    [ 'loc2', '2020-06-19', 'src1', { cases: 10 } ]
  ])
  const re = /can only be created from records with same locationID/
  t.throws(() => createMultivalentRecord(records), re, 'throws when locationIDs are different')
  t.end()
})

test('data from multiple sources are combined if fields are distinct', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 10 } ],
    [ 'loc1', '2020-06-19', 'src2', { deaths: 20 } ]
  ])

  expected = {
    data: { cases: 10, deaths: 20 },
    warnings: {},
    dateSources: { src1: [ 'cases' ], src2: [ 'deaths' ] },
    sources: [ 'src1', 'src2' ]
  }

  validate(t)
  t.end()
})

test('higher priority source overwrites lower priority source', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src2', { cases: 1 }, 1 ],
    [ 'loc1', '2020-06-19', 'src1', { cases: 22222 } ],
  ])

  expected = {
    data: { cases: 1 },
    warnings: {},
    dateSources: 'src2',
    sources: [ 'src2' ]
  }

  validate(t)
  t.end()
})

test('lower priority source is used if higher priority source is missing data for field', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src2', { cases: 2222 }, 1 ],
    [ 'loc1', '2020-06-19', 'src1', { cases: 1, deaths: 1, tested: 0 } ],
  ])

  expected = {
    data: { cases: 2222, deaths: 1, tested: 0 },
    warnings: {},
    dateSources: { src1: [ 'deaths', 'tested' ], src2: [ 'cases' ] },
    sources: [ 'src1', 'src2' ]
  }

  validate(t)
  t.end()
})

test('two sources with same priority and same value is ok, chooses latest one alphabetically', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src2', { cases: 1, deaths: 2222 }, 1 ],
    [ 'loc1', '2020-06-19', 'src1', { cases: 1 }, 1 ],
  ])

  expected = {
    data: { cases: 1, deaths: 2222 },
    warnings: {},
    dateSources: 'src2',
    sources: [ 'src2' ]
  }

  validate(t)
  t.end()
})


/**
 * Conflict resolution tests.
 */

test('same priority but different values adds warning, uses larger value', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 3 }, 1 ],
    [ 'loc1', '2020-06-19', 'src2', { cases: 2 }, 1 ]
  ])

  expected = {
    data: { cases: 3 },
    warnings: { cases: 'conflict (src1: 3, src2: 2)' },
    dateSources: 'src1',
    sources: [ 'src1' ]
  }

  validate(t)
  t.end()
})

test('conflicting lower priority sources are ignored', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 33 }, 1 ],
    [ 'loc1', '2020-06-19', 'src2', { cases: 22 }, 1 ],
    [ 'loc1', '2020-06-19', 'src3', { cases: 1 }, 2 ]
  ])

  expected = {
    data: { cases: 1 },
    warnings: {},
    dateSources: 'src3',
    sources: [ 'src3' ]
  }

  validate(t)
  t.end()
})


test('sanity check, multiple data points', t => {
  records = makeRecords([
    [ 'loc1', '2020-06-19', 'src1', { cases: 3 }, 1 ],
    [ 'loc1', '2020-06-19', 'src2', { cases: 2, deaths: 22 }, 1 ],
    [ 'loc1', '2020-06-19', 'src3', { cases: 1, deaths: 11, tested: 111 }, 1 ]
  ])

  expected = {
    data: {
      cases: 3,
      deaths: 22,
      tested: 111
    },
    warnings: {
      cases: 'conflict (src1: 3, src2: 2, src3: 1)',
      deaths: 'conflict (src2: 22, src3: 11)'
    },
    dateSources: { src1: [ 'cases' ], src2: [ 'deaths' ], src3: [ 'tested' ] },
    sources: [ 'src1', 'src2', 'src3' ]
  }

  validate(t)
  t.end()
})


/** This isn't a real test, it's just verifying current behaviour.  If
 * this test fails, perhaps something in report generation will need
 * to be adjusted. */
test('characterization test: no case data', t => {
  records = [ { locationID: 'loc1', date: '2020-06-19', source: 's' } ]
  expected = { data: {}, warnings: {}, dateSources: {}, sources: [] }
  validate(t)
  t.end()
})


test('sanity check, empty recordset does not throw', t => {
  records = []
  expected = { data: {}, warnings: {}, dateSources: {}, sources: [] }
  validate(t)
  t.end()
})
