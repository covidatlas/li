const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/property-table-columns.js'
const { propertyColumnIndices } = require(sutpath)

test.only('returns indices for exact text matches', t => {
  const headings = [ 'county', 'cases' ]
  const mapping = {
    county: 'county',
    cases: 'cases'
  }
  const actual = propertyColumnIndices(headings, mapping)
  const expected = {
    county: 0,
    cases: 1
  }
  t.deepEqual(actual, expected)
  t.end()
})


// Returns indices, exact text matches
// headings can be ignored
// fails if no match found
// fails if ambiguous
// indices, array of text matches
// indices, regex
// indices, array of text or regexes
// fails if ambiguous text or regex
// fails if match not found
