const parse = require('./_parse.js')

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than the second date
 */
function dateIsBefore (a, b) {
  return parse(a) < parse(b)
}

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is earlier than or equal to the second date
 */
function dateIsBeforeOrEqualTo (a, b) {
  return parse(a) <= parse(b)
}

/**
 * @param {string|Date} a The first date
 * @param {string|Date} b The second date
 * @returns {boolean} true if the first date is later than the second date
 */
function dateIsAfter (a, b) {
  return parse(a) > parse(b)
}

module.exports = {
  dateIsBefore,
  dateIsBeforeOrEqualTo,
  dateIsAfter
}
