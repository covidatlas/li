const path = require('path')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const datetime = require('@architect/shared/datetime/index.js')

module.exports = function getLocalDateFromFilename (filename, tz='America/Los_Angeles') {

  let file = JSON.parse(JSON.stringify(filename)) // Let's not mutate anything inadvertently

  // Extract the file from the path
  file = path.basename(file)

  // Sample filename: 2020-04-11t21_00_00.000z-default-117bb.html.gz
  // TODO (cache-validation): this check belongs somewhere, but not here.
  if (!/^\d{4}-\d{2}-\d{2}t\d{2}_\d{2}_\d{2}\.\d{3}[Zz]-[a-z]+-[a-h0-9]{5}\..*$/.test(file))
    throw new Error(`Bad cache filename ${filename}`)

  // Strip out the extension
  file = file.replace(path.extname(file), '')

  /**
   * Strip out the key and contents sha
   * | ....... 24 chars ....... |
   * | 2020-01-01t01_23_45.678z |
   */
  file = file.substr(0, 24)

  // Pull out the timestamp
  const ts = convert.filenameToZ8601(file)

  // Re-cast it from UTC to the source's timezone
  const castDate = datetime.cast(ts, tz)

  return castDate
}
