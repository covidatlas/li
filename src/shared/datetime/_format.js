const { DateTimeFormatter, LocalDate } = require('@js-joda/core')
require('@js-joda/timezone/dist/js-joda-timezone-10-year-range') // minimize package size by only importing tz data for current year ±5 yrs
const parse = require('./_parse.js')
const { today } = require('./_today.js')

/**
 * @param {string} pattern using [SimpleDateFormat](http://js-joda.github.io/js-joda/manual/formatting.html#format-patterns) codes
 * @param {string=} defaultSeparator the separator used in the pattern provided (can be replaced by caller)
 * @returns A formatting function that takes a date and an optional separator, and returns a string
 */
function buildFormatter (pattern, defaultSeparator = '-') {
  /**
   * @param {string|Date} date The date to format. Defaults to the current date.
   * @param {string=} separator The separator to use instead of the default
   * @returns {string} The formatted date
   */
  const formatterFunction = (date = today.utc(), separator = defaultSeparator) => {
    const separatorRegex = new RegExp(defaultSeparator, 'g')
    const patternWithSeparator = pattern.replace(separatorRegex, separator)
    const formatter = DateTimeFormatter.ofPattern(patternWithSeparator)
    const isoDate = parse(date)
    return LocalDate.parse(isoDate).format(formatter)
  }
  return formatterFunction
}

/**
 * @param {string|Date} date The date to format. Defaults to the current date.
 * @param {string} [separator='_'] The separator to use instead of the default
 * @returns The formatted date
 */
function getMonthDYYYY (date = today.utc(), sep = '_') {
  // not worth bringing in @js-joda/locale_en just for this, so we'll keep this one artisanal
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
  getYYYYMMDD: buildFormatter('yyyy-MM-dd'),
  getYYYYMD: buildFormatter('yyyy-M-d'),
  getDDMMYYYY: buildFormatter('dd-MM-yyyy'),
  getMDYYYY: buildFormatter('M/d/yyyy', '/'),
  getMDYY: buildFormatter('M/d/yy', '/'),
}
