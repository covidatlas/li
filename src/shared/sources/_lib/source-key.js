const { sep } = require('path')

/**
 * Get a canonical key derived from a source file
 */
module.exports = function sourceKey (filePath) {
  let splitAt = `${sep}sources${sep}`
  const parts = filePath.split(splitAt)
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
