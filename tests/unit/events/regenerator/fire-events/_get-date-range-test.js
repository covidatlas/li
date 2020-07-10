const getDatesRange = require('../../../../../src/events/regenerator/fire-events/_get-date-range.js')
const test = require('tape')


test('can get range', t => {
  const actual = getDatesRange('2020-07-11', '2020-07-15')
  const expected = []
  for (let i = 11; i <= 15; i++) expected.push(`2020-07-${i}`)
  t.deepEqual(expected, actual)
  t.end()
})


test('works for daylight savings', t => {
  const actual = getDatesRange('2020-03-06', '2020-03-12')
  const expected = []
  for (let i = 6; i <= 12; i++) expected.push(`2020-03-${('' + i).padStart(2, '0')}`)
  t.deepEqual(expected, actual)
  t.end()
})

// daylight savings
// month turnover
// year turnover
// leap year
// throws if bad dates
// throws if non-dates
// throws if null
