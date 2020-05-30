// TODO

const is = require('is')

function findUniqueMatch (headings, matchers) {
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
  return indices[0]
}

/** Find indexes for property columns in a table's headings. */
function propertyColumnIndices (headings, mapping) {
  const result = {}
  Object.keys(mapping).forEach(k => {
    result[k] = findUniqueMatch(headings, mapping[k])
  })
  return result
}

module.exports = {
  propertyColumnIndices
}
