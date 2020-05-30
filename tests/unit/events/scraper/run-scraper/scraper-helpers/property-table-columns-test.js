const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/property-table-columns.js'
const { propertyColumnIndices, createHash } = require(sutpath)

let headings = [ 'county', 'cases' ]

function assertIndicesEqual (t, mapping, expected) {
  const actual = propertyColumnIndices(headings, mapping)
  t.deepEqual(actual, expected)
}

test('returns indices for exact text matches', t => {
  const mapping = {
    county: 'county',
    cases: 'cases'
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, expected)
  t.end()
})

test('headings can be ignored', t => {
  const mapping = {
    county: 'county'
  }
  const expected = {
    county: 0
  }
  assertIndicesEqual(t, mapping, expected)
  t.end()
})

test('can use regexes', t => {
  const mapping = {
    county: /COUNTY/i,
    cases: /ase/
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, expected)
  t.end()
})

test('fails if no match', t => {
  const mapping = {
    county: /nomatch/,
    cases: 'cases'
  }
  const re = /No match for county in headings/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match', t => {
  const mapping = {
    county: /c/,
    cases: /c/
  }
  const re = /Multiple matches for county in headings/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match due to bad headings', t => {
  headings = [ 'cases', 'cases' ]
  const mapping = {
    cases: 'cases'
  }
  const re = /Multiple matches for cases in headings/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can use array of matchers', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'ants' ],
    deaths: [ /^d/, 'elephants' ]
  }
  const expected = {
    cases: 0,
    deaths: 3
  }
  assertIndicesEqual(t, mapping, expected)
  t.end()
})

test('array of matchers fails if matches multiple columns', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'dogs' ]
  }
  const re = /Multiple matches for cases in headings/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if multiple matchers match the same column', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples' ],
    deaths: [ /pples/, 'elephants' ]
  }
  const re = /Multiple matches for same heading/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})


test('createHash creates a hash', t => {
  const mapping = {
    cases: 0,
    deaths: 4
  }
  const raw = [ 'abc', 1, 2, 'def', 'xxx' ]
  t.deepEqual( { cases: 'abc', deaths: 'xxx' }, createHash(mapping, raw) )
  t.end()
})


test('createHash throws if index out of range', t => {
  const mapping = {
    cases: 0,
    deaths: 4
  }
  const raw = [ 'abc', 1, 2 ]
  const msg = "deaths (index 4) out of range for ['abc', 1, 2]"
  t.throws(() => { createHash(mapping, raw) }, msg)
  t.end()
})
