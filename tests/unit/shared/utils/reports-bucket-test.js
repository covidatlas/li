/** Quick hack tests to verify API only. */

const getReportsBucket = require('../../../../src/shared/utils/reports-bucket.js')
const test = require('tape')

test('can call without argument', t => {
  const r = getReportsBucket()
  t.match(r, /reportsbucket/)
  t.end()
})

test('in non-production environment, calling without argument gives staging bucket', t => {
  const r = getReportsBucket()
  t.match(r, /staging-reportsbucket/)
  t.end()
})

test('calling with production string gives prod bucket', t => {
  const r = getReportsBucket('production')
  t.match(r, /production-reportsbucket/)
  t.end()
})

test('calling with non-production string gives staging bucket', t => {
  const r = getReportsBucket('blah')
  t.match(r, /staging-reportsbucket/)
  t.end()
})

test('calling with staging string gives staging bucket', t => {
  const r = getReportsBucket('staging')
  t.match(r, /staging-reportsbucket/)
  t.end()
})
