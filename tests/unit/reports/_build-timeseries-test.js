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
  let actual = buildTimeseries(records)
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
    source: 'src1',
    priority: 1
  } ]

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 10 }
      },
      sources: {
        '2020-06-19': 'src1'
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
      },
      sources: {
        '2020-06-19..2020-06-20': 'src1'
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
      },
      sources: {
        '2020-06-19..2020-06-20': 'src1'
      }
    },
    {
      locationID: loc2,
      timeseries: {
        '2020-06-19': { cases: 10 },
        '2020-06-20': { deaths: 20 }
      },
      sources: {
        '2020-06-19..2020-06-20': 'src1'
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
      },
      sources: {
        '2020-06-19': { src1: [ 'cases' ], src2: [ 'deaths' ] }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('higher priority source overwrites lower priority source', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src2', { cases: 1 }, 1 ],
    [ loc1, '2020-06-19', 'src1', { cases: 22222 } ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 1 }
      },
      sources: {
        '2020-06-19': 'src2'
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('lower priority source is used if higher priority source is missing data for field', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src2', { cases: 2222 }, 1 ],
    [ loc1, '2020-06-19', 'src1', { cases: 1, deaths: 1, tested: 0 } ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 2222, deaths: 1, tested: 0 }
      },
      sources: {
        '2020-06-19': { src1: [ 'deaths', 'tested' ], src2: [ 'cases' ] }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('two sources with same priority and same value is ok, chooses latest one alphabetically', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src2', { cases: 1, deaths: 2222 }, 1 ],
    [ loc1, '2020-06-19', 'src1', { cases: 1 }, 1 ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': { cases: 1, deaths: 2222 }
      },
      sources: {
        '2020-06-19': 'src2'
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})


/**
 * Conflict resolution tests.
 */

test('same priority but different values adds warning, uses larger value', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 3 }, 1 ],
    [ loc1, '2020-06-19', 'src2', { cases: 2 }, 1 ]
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': {
          cases: 3
        }
      },
      sources: {
        '2020-06-19': 'src1'
      },
      warnings: {
        '2020-06-19': {
          cases: 'conflict (src1: 3, src2: 2)'
        }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})

test('conflicting lower priority sources are ignored', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 33 }, 1 ],
    [ loc1, '2020-06-19', 'src2', { cases: 22 }, 1 ],
    [ loc1, '2020-06-19', 'src3', { cases: 1 }, 2 ]
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': {
          cases: 1
        }
      },
      sources: {
        '2020-06-19': 'src3'
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})


test('sanity check, multiple data points', t => {
  records = makeRecords([
    [ loc1, '2020-06-19', 'src1', { cases: 3 }, 1 ],
    [ loc1, '2020-06-19', 'src2', { cases: 2, deaths: 22 }, 1 ],
    [ loc1, '2020-06-19', 'src3', { cases: 1, deaths: 11, tested: 111 }, 1 ],
    [ loc1, '2020-06-20', 'src1', { cases: 1002, deaths: 1022 }, 1 ],
    [ loc1, '2020-06-20', 'src2', { cases: 1001, deaths: 2222, tested: 1111 }, 1 ],
  ])

  expected = [
    {
      locationID: loc1,
      timeseries: {
        '2020-06-19': {
          cases: 3,
          deaths: 22,
          tested: 111
        },
        '2020-06-20': {
          cases: 1002,
          deaths: 2222,
          tested: 1111
        }
      },
      sources: {
        '2020-06-19': {
          src1: [ 'cases' ], src2: [ 'deaths' ], src3: [ 'tested' ]
        },
        '2020-06-20': {
          src1: [ 'cases' ], src2: [ 'deaths', 'tested' ]
        }
      },
      warnings: {
        '2020-06-19': {
          cases: 'conflict (src1: 3, src2: 2, src3: 1)',
          deaths: 'conflict (src2: 22, src3: 11)'
        },
        '2020-06-20': {
          cases: 'conflict (src1: 1002, src2: 1001)',
          deaths: 'conflict (src1: 1022, src2: 2222)'
        }
      }
    }
  ]

  validateTimeseries(t)
  t.end()
})


test('timeseries fails if missing required fields in any record', t => {

  const minimalRecord = {
    locationID: loc1,
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


/*
Rollup tests (separate module)
if higher level is present, it's left alone
if no higher level, the lower levels roll up to make the higher level
if higher level exists, and lower levels don't roll up to match the higher level, print warning
*/
