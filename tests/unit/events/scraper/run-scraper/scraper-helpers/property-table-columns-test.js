const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/property-table-columns.js'
const { propertyColumnIndices } = require(sutpath)

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

// fails if no match found
// fails if ambiguous
// indices, array of text matches
// indices, array of text or regexes
// fails if ambiguous text or regex
// fails if match not found
