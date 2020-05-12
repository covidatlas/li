const spacetime = require('spacetime')

const { truncate, normalize } = require('./_utils.js')
const looksLike = require('./_looks-like.js')

const couldNotParseDateError = date => new Error(`datetime.parse: Could not parse '${date.toString()}' as a date`)

/**
 * Attempts to interpret the input as a date.
 * @param {Date|string} date The date to parse.
 * @returns {string} The date as an ISO-formatted string, e.g. 2020-03-16
 */
module.exports = function parse (date) {
  if (date === undefined) throw new Error('datetime.parse: Cannot parse undefined as date')
  if (date === null) throw new Error('datetime.parse: Cannot parse null as date')
  if (date === '') throw new Error('datetime.parse: Cannot parse empty string as date')

  // JS Date object
  if (date instanceof Date) date = date.toISOString()

  // String
  if (typeof date === 'string') {
    const str = truncate(normalize(date))
    const s = spacetime(str, 'UTC')

    // ISO date
    if (looksLike.isoDate(str)) {
      return s.format('iso-short')
    }

    // YYYY-M-D
    if (looksLike.YYYYMD(str) || looksLike.YYYYMMDD(str)) {
      const [ y, m, d ] = str.split('-').map(Number) // e.g. [2020, 3, 16]
      return spacetime([ y, m - 1, d ], 'UTC').format('iso-short')
    }

    // M-D-YYYY
    if (looksLike.MDYYYY(str)) {
      const [ m, d, yyyy ] = str.split('-').map(Number) // e.g. [3, 16, 2020]
      return spacetime([ yyyy, m - 1, d ], 'UTC').format('iso-short')
    }

    // M-D-YY
    if (looksLike.MDYY(str)) {
      const [ m, d, yy ] = str.split('-').map(Number) // e.g. [3, 16, 20]
      const yyyy = yy + 2000 // assume current century
      return spacetime([ yyyy, m - 1, d ], 'UTC').format('iso-short')
    }

    // 0: Treat zero as the beginning of unix epoch
    if (s === '0') {
      return spacetime([ 1970, 1, 1 ], 'UTC').format('iso-short')
    }

    // last chance - try using js Date
    // for some values, this will return the previous day when run > GMT
    try {
      const jsdate = new Date(date)
      return truncate(jsdate.toISOString())
    } catch (err) {
      throw couldNotParseDateError(date)
    }
  }

  // Numbers
  if (typeof date === 'number') {
    // for some values, this will return the previous day when run > GMT
    try {
      const jsdate = new Date(date)
      return truncate(jsdate.toISOString())
    } catch (err) {
      throw couldNotParseDateError(date)
    }
  }

  throw couldNotParseDateError(date)
}
