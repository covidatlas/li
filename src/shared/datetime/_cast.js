const spacetime = require('spacetime')

/**
 * Returns locale-cast YYYY-MM-DD from a UTC-cast 8601Z
 * @param {*} tz IANA timezone string, e.g. `America/Los_Angeles`
 * @param {*} utc ISO8601Z string, e.g. `2020-04-02T01:23:45.678Z`
 */
module.exports = function cast (utc, tz='America/Los_Angeles') {
  utc = utc || new Date().toISOString()
  const s = spacetime(utc)
  const there = s.goto(tz)
  return there.format('iso-short')
}
