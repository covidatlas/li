// TODO

function findUniqueMatch (headings, matchers) {
  console.log(headings)
  console.log(matchers)
  return 0
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
