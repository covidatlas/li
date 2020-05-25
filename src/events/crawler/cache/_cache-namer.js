const { join } = require('path')
const hash = require('@architect/shared/cache/_hash.js')
const convert = require('@architect/shared/cache/_convert-timestamp.js')
const { extensions } = require('@architect/shared/sources/_lib/crawl-types.js')

module.exports = function cacheNamer (datetimeISOString, params) {
  const { _sourceKey, _name, data, type, page } = params

  // Filepath
  const date = datetimeISOString.substr(0, 10)
  const filepath = join(_sourceKey, date)

  // Filename
  const pageIndicator = (page !== undefined) ? `-${page}` : ''
  const contents = hash(data, 5)
  const ext = extensions[type]
  const time = convert.Z8601ToFilename(datetimeISOString)

  const filename = `${time}-${_name}${pageIndicator}-${contents}.${ext}`

  return { filepath, filename }
}
