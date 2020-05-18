const sorter = require('@architect/shared/utils/sorter.js')
const getLocalDateFromFolder = require('./_get-local-date-from-folder.js')

/**
 * Takes a cached path, returns date boundaries
 */
module.exports = function getDateBounds (folders, tz) {
  const sorted = sorter(folders) // jic
  const earliest = getLocalDateFromFolder(sorted[0], tz)
  const latest = getLocalDateFromFolder(sorted[sorted.length - 1], tz)

  return { earliest, latest }
}
