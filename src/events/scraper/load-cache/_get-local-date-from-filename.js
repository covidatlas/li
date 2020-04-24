const path = require('path')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const datetime = require('@architect/shared/datetime/index.js')

module.exports = function getLocalDateFromFilename (filename, tz='America/Los_Angeles') {

  let file = JSON.parse(JSON.stringify(filename)) // Let's not mutate anything inadvertently

  // Extract the file from the path
  file = path.basename(file)

  // Sample filename: 2020-04-11t01_23_45.678z-default-117bb.html.gz
  // TODO (cache-validation): this check belongs somewhere, but not here.
  const check = /^\d{4}-\d{2}-\d{2}t\d{2}_\d{2}_\d{2}\.\d{3}[Zz]-[a-z]+-[a-h0-9]{5}\..*$/
  if (!check.test(file)) {
    throw new Error(`Bad cache filename ${filename}`)
  }

  /**
   * Extract only the date, ignore the rest
   * | ....... 24 chars ....... |
   * | 2020-01-01t01_23_45.678z |
   */
  file = file.substr(0, 24)

  // Un-filename the timestamp
  const ts = convert.filenameToZ8601(file)

  // Re-cast it from UTC to the source's timezone
  const castDate = datetime.cast(ts, tz)

  return castDate
}
