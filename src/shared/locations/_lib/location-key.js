const { sep } = require('path')

/**
 * Get a canonical key derived from a location file
 */
module.exports = function locationKey (filePath) {
  const parts = filePath.split(`shared${sep}locations`)
  if (!parts[1]) {
    throw Error(`Invalid filePath: ${filePath}`)
  }
  const key = parts[1]
    .replace('index.js', '')
    .replace('.js', '')
    .split(sep)
    .filter(p => p)
    .join('-')
  return key
}
