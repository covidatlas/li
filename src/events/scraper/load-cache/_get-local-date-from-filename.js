// const path = require('path')
// const convert = require('@architect/shared/cache/_convert-timestamp.js')
// const datetime = require('@architect/shared/datetime/index.js')

module.exports = function getLocalDateFromFilename(/*filename, tz='America/Los_Angeles'*/) {
  /*
  let file = JSON.parse(JSON.stringify(filename)) // Let's not mutate anything inadvertently

  // Extract the file from the path
  file = path.basename(file)

  // Strip out the extension
  file = file.replace(path.extname(file), '')

  // Strip out the contents sha
  file = file.substr(0, file.length - 6)

  // Pull out the timestamp
  const ts = convert.filenameToZ8601(file)

  // Re-cast it from UTC to the source's timezone
  const castDate = datetime.cast(ts, tz)
  */

  const castDate = new Date().toISOString().substr(0, 10)

  return castDate
}
