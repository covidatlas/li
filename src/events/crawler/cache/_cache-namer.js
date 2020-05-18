const { join } = require('path')
const assert = require('assert')
const hash = require('@architect/shared/cache/_hash.js')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const { extensions } = require('@architect/shared/sources/_lib/crawl-types.js')

/** Get the folder name to use for a crawl result. */
function cacheFolder (params) {
  const { _sourceKey } = params

  const now = new Date().toISOString()
  const nowfile = convert.Z8601ToFilename(now)
  // nowfile should look like: 2020-05-17t18_12_28.732z
  const parts = nowfile.split('t')

  assert.equal(parts.length, 2, 'should have date and time')
  const dateRe = /^\d{4}-\d{2}-\d{2}$/
  assert(parts[0].match(dateRe), `Date ${parts[0]} should match ${dateRe}`)
  const timeRe = /^\d{2}_\d{2}_\d{2}\.\d{3}z$/
  assert(parts[1].match(timeRe), `Time ${parts[1]} should match ${timeRe}`)

  return join(_sourceKey, ...parts)
}

function cacheNamer (params) {
  const { _name, data, type } = params
  const contents = hash(data, 5)
  const ext = extensions[type]
  const filename = `${_name}-${contents}.${ext}`
  return filename
}

module.exports = {
  cacheFolder,
  cacheNamer
}
