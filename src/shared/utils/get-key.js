/**
 * Get a key from an array of objects that contains the label for
 * @param {object} options - The options for getKey.
 * @param {string} options.label - The label we are trying to match (a scraped heading).
 * @param {{cases: string?, deaths: string?, tested: string?, discard: string?}[]} options.labelFragmentsByKey - An array of objects, where key is in our schema, and value is a partial match against whatever is in the heading from the scrape.
 * @returns {string} The key from our schema that matches the input label.
 */
const getKey = ({ label, labelFragmentsByKey }) => {
  const lowerLabel = label.toLowerCase()
  const definitionIndex = labelFragmentsByKey.findIndex(definition => lowerLabel.includes(Object.values(definition)[0]))
  if (definitionIndex === -1) {
    throw new Error(`There is an unexpected label: ${lowerLabel}`)
  }
  return Object.keys(labelFragmentsByKey[definitionIndex])[0]
}

module.exports = getKey
