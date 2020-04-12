const spacetime = require('spacetime')
const parse = require('./_parse.js')
const { today } = require('./_today.js')

/**
 * @param {string} pattern using SimpleDateFormat codes
 * @param {string=} defaultSeparator the separator used in the pattern provided (can be replaced by caller)
 * @returns A formatting function that takes a date and an optional separator, and returns a string
 */
function format (pattern, defaultSeparator='-') {
  /**
   * @param {string|Date} date The date to format. Defaults to the current date.
   * @param {string=} separator The separator to use instead of the default
   * @returns {string} The formatted date
   */
  const formatterFunction = (date = today.utc(), separator=defaultSeparator) => {
    const separatorRegex = new RegExp(defaultSeparator, 'g')
    const patternWithSeparator = pattern.replace(separatorRegex, separator)
    const s = spacetime(date)
    return s.unixFmt(patternWithSeparator)
  }
  return formatterFunction
}

/**
 * @param {string|Date} date The date to format. Defaults to the current date.
 * @param {string} [separator='_'] The separator to use instead of the default
 * @returns The formatted date
 */
function getMonthDYYYY (date = today.utc(), sep = '_') {
  // not worth bringing in a locale lib just for this, so we'll keep this one artisanal
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const isoDate = parse(date)
  const [y, m, d] = isoDate.split('-').map(Number)
  return `${MONTHS[m - 1]}${sep}${d}${sep}${y}`
}

module.exports = {
  getMonthDYYYY,
  getYYYYMMDD: format('yyyy-MM-dd'),
  getYYYYMD: format('yyyy-M-d'),
  getDDMMYYYY: format('dd-MM-yyyy'),
  getMDYYYY: format('M/d/yyyy', '/'),
  getMDYY: format('M/d/yy', '/'),
}
