const sorter = require('@architect/shared/utils/sorter.js')
const getLocalDateFromFilename = require('./_get-local-date-from-filename.js')

/**
 * Takes a cached filename, returns date boundaries
 */
module.exports = function getDateBounds (files, tz) {
  if (!files || files.length === 0) {
    throw new Error('No files provided')
  }

  const sorted = sorter(files) // jic
  const earliest = getLocalDateFromFilename(sorted[0], tz)
  const latest = getLocalDateFromFilename(sorted[sorted.length - 1], tz)

  return { earliest, latest }
}
