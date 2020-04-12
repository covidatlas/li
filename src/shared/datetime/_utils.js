const { ZonedDateTime } = require('@js-joda/core')

/**
 * Util functions
 */
function currentJsDate () {
  return new Date(Date.now()) // allows us to mock current date
}

function currentZdt () {
  return ZonedDateTime.parse(currentJsDate().toISOString())
}

function normalize (d) {
  return d.replace(/[\\/.]/g, '-') // replaces slashes & dots with dashes
}

// truncate ISO datetime to ISO date
function truncate (datetime) {
  return datetime
  .split(' ')[0] //
  .split('T')[0]
}

module.exports = {
  currentJsDate,
  currentZdt,
  normalize,
  truncate
}
