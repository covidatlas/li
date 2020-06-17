const test = require('tape')

const sutpath = '../../../../../../src/events/scraper/run-scraper/scraper-helpers/normalize-key.js'
const { propertyColumnIndices, normalizeKey, createHash } = require(sutpath)

/**
 * normalizeKey tests
 */

function assertNormalizedKeyEquals (t, key, mapping, expected) {
  const actual = normalizeKey(key, mapping)
  t.equal(actual, expected)
}

test('single string can be mapped to a property if fragment matches', t => {
  const headings = [
    'case', 'cases', 'CASES', 'Cases',
    'positive cases', 'total cases',
    'number of cases',
    'base', 'vases', 'phase'  // !
  ]
  const mapping = { cases: 'ase' }
  headings.forEach(heading => {
    assertNormalizedKeyEquals(t, heading, mapping, 'cases')
  })
  t.end()
})

test('multiple entries in map can resolve to the same thing', t => {
  const mapping = { cases: [ 'case', 'positive' ] }
  assertNormalizedKeyEquals(t, 'positive cases', mapping, 'cases')
  t.end()
})

test('unmapped heading throws', t => {
  const mapping = { cases: 'cases' }
  const testcases = [ 'apple', 'cayses', 'k' ]
  testcases.forEach(c => {
    t.throws(() => normalizeKey(c, mapping ), c)
  })
  t.end()
})

test('can map a key to ignore', t => {
  const mapping = {
    cases: [ 'case', 'positive' ],
    ignore: [ 'other', 'another' ]
  }
  assertNormalizedKeyEquals(t, 'positive cases', mapping, 'cases')
  assertNormalizedKeyEquals(t, 'cases', mapping, 'cases')
  assertNormalizedKeyEquals(t, 'something other than that', mapping, null)
  assertNormalizedKeyEquals(t, 'another thing', mapping, null)
  t.end()
})

test('entry mapped to multiple distinct values fails', t => {
  const mapping = {
    cases: 'case',
    deaths: 'death'
  }
  const errRe = /Multiple matches for deathlike_case in mapping/
  t.throws(() => normalizeKey('deathlike_case', mapping), errRe)
  t.end()
})

test('all mapping destination values must exist in schema', t => {
  const mapping = {
    invalid_mapping_key: 'positive'
  }
  const errRe = /Invalid keys in mapping: invalid_mapping_key/
  t.throws(() => normalizeKey('positive', mapping), errRe)
  t.end()
})


/**
 * propertyColumnIndices tests
 */

let headings = [ 'county', 'cases' ]

function assertIndicesEqual (t, mapping, headings, expected) {
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
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('all headings must be mapped', t => {
  const mapping = {
    county: 'county'
  }
  const re = new RegExp('No matches for cases in mapping')
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can ignore headings by mapping them to ignore', t => {
  const mapping = {
    county: 'county',
    ignore: 'cases'
  }
  const expected = {
    county: 0
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('can use ignore mapping as catch-all for unmapped headings', t => {
  const mapping = {
    county: 'county',
    ignore: /.*/
  }
  const headings = [ 'county', 'something', 'else', 'here' ]
  const expected = {
    county: 0
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('can have several mappings all mapping to the same property', t => {
  const mapping = {
    county: [ 'county', 'ount', 'ty', /count/ ],
    cases: 'cases'
  }
  const expected = {
    county: 0,
    cases: 1
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('text matches are case-insensitive and do not have to match full string', t => {
  const testcases = [
    'case', 'cases', 'CASES', 'Cases',
    'positive cases', 'total cases',
    'number of cases',
    'base', 'vases', 'phase'
  ]
  testcases.forEach(c => {
    const headings = [ c ]

    const mapping = {
      cases: 'as'  // This matches every test case above.
    }
    const expected = {
      cases: 0
    }

    assertIndicesEqual(t, mapping, headings, expected)
  })

  t.end()
})

/** Schema keys are hardcoded in the sut file. */
test('all mapping destination values must exist in schema', t => {
  const mapping = {
    invalid_key: 'something'
  }
  const re = /Invalid keys in mapping: invalid_key/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
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
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('fails if no match', t => {
  const mapping = {
    county: /nomatch/,
    cases: 'cases'
  }
  const re = /No matches for county in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match', t => {
  const mapping = {
    county: /c/,
    cases: /c/
  }
  const re = /Multiple matches for county in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if ambiguous match due to bad headings', t => {
  headings = [ 'cases', 'cases' ]
  const mapping = {
    cases: 'cases'
  }
  const re = /Duplicate mapping of cases to indices 0 and 1/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('can use array of matchers', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'ants' ],
    tested: [ 'bats' ],
    hospitalized: [ 'cats' ],
    deaths: [ /^d/, 'elephants' ]
  }
  const expected = {
    cases: 0,
    tested: 1,
    hospitalized: 2,
    deaths: 3
  }
  assertIndicesEqual(t, mapping, headings, expected)
  t.end()
})

test('array of matchers fails if matches multiple columns', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples', 'dogs' ],
    tested: 'bats',
    deaths: 'cats'
  }
  const re = /Duplicate mapping of cases to indices 0 and 3/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})

test('fails if multiple matchers match the same column', t => {
  headings = [ 'apples', 'bats', 'cats', 'dogs' ]
  const mapping = {
    cases: [ 'apples' ],
    deaths: [ /pples/, 'elephants' ]
  }
  const re = /Multiple matches for apples in mapping/
  t.throws(() => { propertyColumnIndices(headings, mapping) }, re)
  t.end()
})


test('createHash creates a hash', t => {
  const mapping = {
    county: 0,
    state: 4
  }
  const raw = [ 'abc', 1, 2, 'def', 'xxx' ]
  t.deepEqual( { county: 'abc', state: 'xxx' }, createHash(mapping, raw) )
  t.end()
})


test('createHash can take a lambda to fix numeric data', t => {
  const mapping = {
    county: 0,
    cases: 1
  }
  const raw = [ 'abc', 'xyz' ]
  const cleanup = {
    numeric: s => s.replace('xyz', '1234')
  }
  t.deepEqual( { county: 'abc', cases: 1234 }, createHash(mapping, raw, cleanup) )
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


test('createHash converts expected numeric data to numbers', t => {
  const raw = [ 'abc', 'def', '1', '22', '0', '', null, undefined ]
  const mapping = {
    state: 0,
    county: 1,
    cases: 2,
    deaths: 3,
    tested: 4,
    hospitalized: 5,
    icu: 6,
    recovered: 7
  }
  const expected = {
    state: 'abc',
    county: 'def',
    cases: 1,
    deaths: 22,
    tested: 0,
    hospitalized: undefined,
    icu: undefined,
    recovered: undefined
  }
  t.deepEqual( createHash(mapping, raw), expected )
  t.end()
})


test('createHash converts blank null undef to undefined', t => {
  const raw = [ 'abc', '0', '', null, undefined ]
  const mapping = {
    state: 0,
    cases: 1,
    deaths: 2,
    tested: 3,
    hospitalized: 4
  }
  const expected = {
    state: 'abc',
    cases: 0,
    deaths: undefined,
    tested: undefined,
    hospitalized: undefined
  }
  t.deepEqual( createHash(mapping, raw), expected )
  t.end()
})
