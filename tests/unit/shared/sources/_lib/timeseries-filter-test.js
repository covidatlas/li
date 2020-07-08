const test = require('tape')
const timeseriesFilter = require('../../../../../src/shared/sources/_lib/timeseries-filter.js')

// The timeseries data that we're filtering.
let data = [
  { d: '13 / Jan / 2020', a: 13 },
  { d: '14 / Jan / 2020', a: 14 },
  { d: '15 / Jan / 2020', a: 15 }
]

// Function that converts the date to YYYY-MM-DD.
let getYYYYMMDD = (s) => {
  let [ dd, mm, yyyy ] = s.split(' / ')
  if (mm === 'Jan')
    mm = '01'
  return [ yyyy, mm, dd ].join('-')
}

test('filter returns correct data', t => {
  const f = timeseriesFilter(data, 'd', getYYYYMMDD, '2020-01-14')
  t.equal(f.filterDate, '2020-01-14', 'using same date passed in')
  t.deepEqual(data.filter(f.func), [ { d: '14 / Jan / 2020', a: 14 } ], 'correct record returned')
  t.end()
})

test('date earlier than earliest date throws', t => {
  t.throws(() => timeseriesFilter(data, 'd', getYYYYMMDD, '2020-01-01'))
  t.end()
})

test('date later than latest date returns latest date for filter', t => {
  const f = timeseriesFilter(data, 'd', getYYYYMMDD, '2020-01-16')
  t.equal(f.filterDate, '2020-01-15', 'using latest date')
  t.deepEqual(data.filter(f.func), [ { d: '15 / Jan / 2020', a: 15 } ], 'correct record returned')
  t.end()
})

// Warning for stale data.
test('date more than 5 days after latest date throws', t => {
  t.throws(() => timeseriesFilter(data, 'd', getYYYYMMDD, '2020-07-07'))
  t.end()
})

test('empty data set is ok', t => {
  const f = timeseriesFilter([], 'd', getYYYYMMDD, '2020-07-07')
  t.equal(f.filterDate, '2020-07-07', 'current date')
  t.deepEqual([].filter(f.func), [], 'filter does nothing')
  t.end()
})
