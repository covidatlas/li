const { LocalDate, ZoneId } = require('@js-joda/core')
require('@js-joda/timezone/dist/js-joda-timezone-10-year-range') // minimize package size by only importing tz data for current year ±5 yrs
const { currentZdt } = require('./_utils.js')

const today = {
  /**
   * @returns {string} The current date (UTC) in ISO format. Example: `2020-03-16`
   */
  utc: function () {
    return this.at('UTC')
  },

  /**
   * @param {string} tz The IANA label for the target timezone. Examples: `Australia/Sydney`, `America/Los_Angeles`
   * @returns {string} The current date at the given timezone, in ISO format. Example: `2020-03-16`
   */
  at: function (tz) {
    const currentZdtThere = currentZdt().withZoneSameInstant(ZoneId.of(tz))
    return LocalDate.from(currentZdtThere).toString()
  }
}

/**
 * @returns {string} The current date (UTC) as an ISO string
 */
const getDate = () => today.utc()

module.exports = {
  getDate,
  today
}
