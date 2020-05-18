const path = require('path')
const assert = require('assert')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const datetime = require('@architect/shared/datetime/index.js')

module.exports = function getLocalDateFromFolder (foldername, tz='America/Los_Angeles') {

  // foldername looks like
  // "... /{sourceKey}/2020-05-17/20_44_14.757z", where the last 2
  // parts are the date and the time.  Join these with 't' to get the
  // timestamp.
  const parts = foldername.split(path.sep)
  assert(parts.length >= 2, `Need at least 2 parts in ${foldername}`)
  const dateparts = parts.splice(parts.length - 2, 2)

  // Un-filename in to a time.
  const ts = convert.filenameToZ8601(dateparts.join('t'))

  // Re-cast it from UTC to the source's timezone
  const castDate = datetime.cast(ts, tz)

  return castDate
}
