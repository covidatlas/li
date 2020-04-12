const spacetime = require('spacetime')

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
    const s = spacetime(Date.now())
    const there = s.goto(tz)
    return there.format('iso-short')
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
