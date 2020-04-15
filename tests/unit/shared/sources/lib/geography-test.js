const test = require('tape')
const { join } = require('path')

const sut = join(process.cwd(), 'src', 'shared', 'sources', '_lib', 'geography', 'index.js')
const geography = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(geography, 'geography exists')
})

test('Test addEmptyRegions', t => {
  t.plan(7)
  let counties = [
    {
      county: 'a',
      cases: 1
    }
  ]
  const countyNames = ['a', 'b', 'c']
  counties = geography.addEmptyRegions(counties, countyNames, 'county')
  t.equal(counties.length, 3, 'addEmptyRegions added correct number of counties')
  t.equal(counties[0].county, 'a', 'region matches')
  t.equal(counties[0].cases, 1, 'cases match')
  t.equal(counties[1].county, 'b', 'region matches')
  t.equal(counties[1].cases, 0, 'Backfilled 0 cases')
  t.equal(counties[2].county, 'c', 'region matches')
  t.equal(counties[2].cases, 0, 'Backfilled 0 cases')
})
