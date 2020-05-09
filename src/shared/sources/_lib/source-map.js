const glob = require('glob').sync
const globJoin = require('../../utils/glob-join.js')
const sourceKey = require('./source-key.js')
const { sep } = require('path')

module.exports = function sourceMap () {
  let scrapersDir = globJoin(__dirname, '..')
  if (process.env.LI_SOURCES_PATH)
    scrapersDir = process.env.LI_SOURCES_PATH

  const scrapers = globJoin(scrapersDir, '**', '*.js')
  let filePaths = glob(scrapers)
  // Ensure forward slashes emitted by glob get re-normalized per-platform
  filePaths = filePaths.map(f => f.split('/').join(sep))

  // Ignore any directory or file that starts with `_`
  const filterFiles = file => {
    const parts = file.split(sep)
    return !parts.some(part => part.startsWith('_'))
  }
  filePaths = filePaths.filter(filterFiles)

  let sources = {}
  for (const file of filePaths) {
    sources[sourceKey(file)] = file
  }

  return sources
}
