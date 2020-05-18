const { gunzipSync } = require('zlib')
const fs = require('fs')
const { basename, join } = require('path')
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

/** Each sourceKey has cache folder structure: {date}/{time}/{file}.
 * Get list of {date}/{time} folders. */
async function getTimeFolders (params) {
  const { _sourceKey, folders } = params

  // Gather yesterday (UTC+), today, and tomorrow (UTC-).
  let timefolders = []
  const cacheDirs = getDatedFolders(params)
  for (const cacheDir of cacheDirs) {
    if (folders[cacheDir] !== undefined) {
      const p = cachePath(_sourceKey)
      const subdirs = fs.readdirSync(join(p, folders[cacheDir]))
      const result = subdirs.map(s => join(folders[cacheDir], s))
      timefolders = timefolders.concat(result)
    }
  }
  return timefolders
}

/** Return just the filename. */
async function getFiles (params) {
  const { _sourceKey, folder } = params
  const p = join(cachePath(_sourceKey), folder)
  const files = fs.readdirSync(p).map(s => basename(s))
  return files
}

async function getFileContents (params) {
  const { _sourceKey, folder, file } = params
  const filePath = join(cachePath(_sourceKey), folder, file)

  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath)
    return gunzipSync(file)
  }
  else throw Error('Unknown local cache reading error')
}


module.exports = {
  getFolders,
  getTimeFolders,
  getFiles,
  getFileContents
}
