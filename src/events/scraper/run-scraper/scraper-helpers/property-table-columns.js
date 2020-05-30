const is = require('is')

function findUniqueMatch (headings, key, matchers) {
  if (!is.array(matchers))
    matchers = [ matchers ]
  const indices = []
  for (var i = 0; i < headings.length; i++) {
    matchers.forEach(m => {
      if (is.string(m) && headings[i] === m)
        indices.push(i)
      if (is.regexp(m) && headings[i].match(m))
        indices.push(i)
    })
  }
  if (indices.length === 0)
    throw new Error(`No match for ${key} in headings`)
  if (indices.length > 1)
    throw new Error(`Multiple matches for ${key} in headings`)
  return indices[0]
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
 *  This returns {
 *    cases: 0,
 *    deaths: 3
 *  }
 */
function propertyColumnIndices (headings, mapping) {
  const result = {}
  Object.keys(mapping).forEach(k => {
    result[k] = findUniqueMatch(headings, k, mapping[k])
  })
  const indices = Object.values(result)
  const uniqueIndices = Array.from(new Set(indices))
  if (indices.length !== uniqueIndices.length)
    throw new Error('Multiple matches for same heading')
  return result
}

module.exports = {
  propertyColumnIndices
}
