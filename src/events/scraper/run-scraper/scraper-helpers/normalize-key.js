const assert = require('assert')
const slugify = require('slugify')
const parse = require('@architect/shared/sources/_lib/parse.js')


/**
 * Schema fields that we can use as mapping 'destinations' when
 * mapping headings. */
const _validProperties = {

  numeric: [
    'active',
    'cases',
    'deaths',
    'hospitalized',
    'icu',
    'recovered',
    'tested',

    // Not in final schema, used for negative
    // results to then combine with cases to get
    // `tested` number.
    'testedNegative'
  ],

  text: [
    'county',
    'state'
  ],

  // Use when we want to discard the heading/column.
  ignore: [
    'ignore'
  ]
}


/** Ensure the mapping only contains valid map 'destinations' (i.e.,
 * we're mapping headings to valid data dimensions). */
function _validateMappingKeys (mapping) {
  // Use when we want to discard the heading/column.
  const validProperties = Object.values(_validProperties).reduce((arr, v) => {
    return arr.concat(v)
  }, [])

  const badKeys = Object.keys(mapping).
    filter(k => k !== 'ignore').
    filter(k => !validProperties.includes(k))
  assert(badKeys.length === 0, `Invalid keys in mapping: ${badKeys.join()}`)
}

/** Get array of all properties that a heading could map to. */
function _allPropertiesForHeading (heading, mapping) {

  const toArray = a => [ a ].flat()

  const slugged = s => slugify(s, { lower: true })

  const matchesHeading = m => {
    return false ||
      (typeof(m) === 'string' && slugged(heading).includes(slugged(m))) ||
      (m instanceof RegExp && heading.match(m))
  }

  return Object.keys(mapping).filter(prop => {
    return toArray(mapping[prop]).some(matchesHeading)
  })
}

/** Returns single property returned by using the mapping. */
function _propertyForHeading (heading, mapping) {
  const props = _allPropertiesForHeading(heading, mapping)
  if (props.length === 0)
    throw new Error(`No matches for "${heading}" in mapping`)

  const realProps = props.filter(p => p !== 'ignore')
  if (realProps.length === 0)
    return null
  if (realProps.length > 1)
    throw new Error(`Multiple matches for "${heading}" in mapping`)
  return realProps[0]
}

/** Find indexes for property columns in a table's headings.
 *
 * Example:
 *
 *  const headings = [ 'apples', 'bats', 'cats', 'dogs' ]
 *
 *  const mapping = {
 *    cases: [ 'apples', 'ants' ],
 *    deaths: [ /^d/, 'elephants' ]
 *  }
 *
 *  This returns { cases: 0, deaths: 3 }
 *
 * If the key in mapping is 'ignore', the field matching it
 * will be ignored:
 *
 *  const mapping = {
 *    cases: [ 'apples', 'ants' ],
 *    ignore: [ /^d/, 'elephants' ]
 *  }
 *
 *  This returns { cases: 0 }
 */
function propertyColumnIndices (headings, mapping) {
  _validateMappingKeys(mapping)
  const result = {}
  assert(headings, `No headings array, got ${JSON.stringify(headings)}`)
  headings.forEach((heading, index) => {
    const p = _propertyForHeading(heading, mapping)
    if (result[p] !== undefined) {
      throw new Error(`Duplicate mapping of ${p} to indices ${result[p]} and ${index}`)
    }
    if (p)
      result[p] = index
  })
  return result
}

/** Normalizes a key to a proper domain key. */
function normalizeKey (key, mapping) {
  _validateMappingKeys(mapping)
  return _propertyForHeading(key, mapping)
}

/** Helper method: make a hash. */
function createHash (propertyIndices, arr, cleanupFunctions = {}) {
  return Object.entries(propertyIndices).reduce((hsh, pair) => {
    const [ key, i ] = pair
    if (i > (arr.length - 1)) {
      const msg = `${key} (index ${i}) out of range for ${JSON.stringify(arr)}`
      throw new Error(msg)
    }

    let value = arr[i]
    if ([ '', null, undefined ].includes(value))
      value = undefined
    if (value && _validProperties.numeric.includes(key)) {
      if (cleanupFunctions.numeric)
        value = cleanupFunctions.numeric(value)
      value = parse.number(value)
    }

    hsh[key] = value
    return hsh
  }, {})
}

module.exports = {
  propertyColumnIndices,
  createHash,
  normalizeKey
}
