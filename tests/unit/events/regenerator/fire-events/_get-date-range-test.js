const getDatesRange = require('../../../../../src/events/regenerator/fire-events/_get-date-range.js')
const test = require('tape')


test('can get range', t => {
  const actual = getDatesRange('2020-07-11', '2020-07-15')
  const expected = []
  for (let i = 11; i <= 15; i++) expected.push(`2020-07-${i}`)
  t.deepEqual(expected, actual)
  t.end()
})


test('same start and end', t => {
  const actual = getDatesRange('2020-07-11', '2020-07-11')
  const expected = [ '2020-07-11' ]
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


test('works at month turnover', t => {
  const actual = getDatesRange('2020-03-29', '2020-04-02')
  const expected = [
    '2020-03-29',
    '2020-03-30',
    '2020-03-31',
    '2020-04-01',
    '2020-04-02'
  ]
  t.deepEqual(expected, actual)
  t.end()
})


test('works at year turnover', t => {
  const actual = getDatesRange('2020-12-30', '2021-01-02')
  const expected = [
    '2020-12-30',
    '2020-12-31',
    '2021-01-01',
    '2021-01-02'
  ]
  t.deepEqual(expected, actual)
  t.end()
})


test('works at leap year', t => {
  let actual = getDatesRange('2020-02-27', '2020-03-01')
  let expected = [
    '2020-02-27',
    '2020-02-28',
    '2020-02-29',
    '2020-03-01'
  ]
  t.deepEqual(expected, actual, 'leap year')

  actual = getDatesRange('2021-02-27', '2021-03-01')
  expected = [
    '2021-02-27',
    '2021-02-28',
    '2021-03-01'
  ]
  t.deepEqual(expected, actual, 'non-leap year')

  t.end()
})


test('throws on non dates', t => {
  t.throws(() => getDatesRange('something', 'here'))
  t.end()
})


test('throws if earlier > later', t => {
  t.throws(() => getDatesRange('2020-07-08', '2020-07-07'))
  t.end()
})


test('throws if missing date', t => {
  t.throws(() => getDatesRange(null, '2020-07-11'))
  t.end()
})
