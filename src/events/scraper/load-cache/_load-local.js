const { gunzipSync } = require('zlib')
const fs = require('fs')
const { join } = require('path')
const datetime = require('@architect/shared/datetime/index.js')

const cache = join(__dirname, '..', '..', '..', '..', 'crawler-cache')
const cachePath = key => join(cache, key)

async function getFolders (_sourceKey) {
  if (!fs.existsSync(cachePath(_sourceKey))) {
    return []
  }
  let folders = fs.readdirSync(cachePath(_sourceKey))
  return folders
}

async function getFiles (params) {
  const {
    _sourceKey,
    date,
    folders,
    timeseries,
    tz
  } = params

  // Gather yesterday (UTC+), today, and tomorrow (UTC-)
  let files = []
  let d = timeseries ? datetime.today.at(tz) : date
  let today = folders.findIndex(f => f === d)

  // Pull contents from as many as three cache dirs
  if (today === -1) today = folders.findIndex(f => f === datetime.getYYYYMMDD())
  const cacheDirs = [today - 1, today, today + 1]
  for (const cacheDir of cacheDirs) {
    if (folders[cacheDir] !== undefined) {
      const result = fs.readdirSync(join(cachePath(_sourceKey), folders[cacheDir]))
      files = files.concat(result)
    }
  }

  return { files }
}

async function getFileContents (params) {
  const { _sourceKey, file } = params

  const dir = file.substr(0, 10)
  const filePath = join(cachePath(_sourceKey), dir, file)

  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath)

    // Should always be gzipped, but jic, esp working locally
    return filePath.endsWith('.gz') ? gunzipSync(file) : file
  }
  else throw Error('Unknown local cache reading error')
}


module.exports = {
  getFolders,
  getFiles,
  getFileContents
}
