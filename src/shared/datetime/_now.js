const spacetime = require('spacetime')

const now = {
  /** @returns {string} The current date and time (UTC) in ISO format. Example: `2020-03-16T12:34:56.789Z` */
  utc: () => {
    return `${now.at('UTC')}Z`
  },

  /**
   * @param {string} tz The IANA label for the target timezone. Examples: `Australia/Sydney`, `America/Los_Angeles`
   * @returns {string} The current date and time at the given timezone, in ISO format. Example: `2020-03-16T23:45`
   */
  at: tz => {
    const s = spacetime(Date.now())
    const there = s.goto(tz)
    return there.format('iso').substr(0, 16)
  }
}

module.exports = now
