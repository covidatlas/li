const glob = require('glob').sync
const globJoin = require('../../utils/glob-join.js')

module.exports = function loadSources () {
  const scrapers = globJoin(__dirname, '..', '**', '*.js')
  let filePaths = glob(scrapers)

  // Ignore any directory or file that starts with `_`
  const filterFiles = file => {
    const parts = file.split('/')
    return !parts.some(part => part.startsWith('_'))
  }
  filePaths = filePaths.filter(filterFiles)

  return filePaths
}
