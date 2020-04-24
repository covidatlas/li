const { join } = require('path')
const hash = require('@architect/shared/cache/_hash.js')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const { extensions } = require('@architect/shared/sources/_lib/crawl-types.js')

module.exports = function cacheNamer (params) {
  const { _sourceKey, _name, data, type } = params

  // Filepath
  const now = new Date().toISOString()
  const date = now.substr(0, 10)
  const filepath = join(_sourceKey, date)

  // Filename
  const contents = hash(data, 5)
  const ext = extensions[type]
  const time = convert.Z8601ToFilename(now)
  const filename = `${time}-${_name}-${contents}.${ext}`

  return { filepath, filename }
}
