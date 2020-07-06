/** Print selected headings of the data to console.table
 *
 * Extremely useful during development.
 */

/** console.table(data), removing unnecessary headings. */
module.exports = function consoleTable (data) {
  const allHeadings = data.reduce((s, obj) => {
    return [ ...new Set(s.concat(Object.keys(obj))) ]
  }, [])

  // Exclude some fields:
  // locationID already contains country/state/county
  const removeHeadings = [
    'county', 'country', 'state', 'dateSource', 'source', 'priority'
  ]
  const keepHeadings = allHeadings.filter(h => !removeHeadings.includes(h))

  // Put locationID and date first.
  const headings = [ ...new Set([ 'locationID', 'date' ].concat(keepHeadings)) ]

  console.table(data, headings)
}
