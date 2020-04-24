const { gunzipSync } = require('zlib')
const fs = require('fs')
const { join } = require('path')
const getDatedFolders = require('./_get-dated-folders.js')

let defaultcache = join(__dirname, '..', '..', '..', '..', 'crawler-cache')

/** Return the default cache path, or LI_CACHE_PATH if set in env. */
function cachePath (key) {
  let cache = defaultcache
  if (process.env.LI_CACHE_PATH) {
    cache = process.env.LI_CACHE_PATH
  }
  return join(cache, key)
}

async function getFolders (_sourceKey) {
  if (!fs.existsSync(cachePath(_sourceKey))) {
    return []
  }
  let folders = fs.readdirSync(cachePath(_sourceKey))
  return folders
}

async function getFiles (params) {
  const { _sourceKey, folders } = params

  // Gather yesterday (UTC+), today, and tomorrow (UTC-)
  let files = []
  const cacheDirs = getDatedFolders(params)
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
