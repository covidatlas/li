const fs = require('fs')
const { join } = require('path')
const { gzipSync } = require('zlib')

module.exports = async function writeLocal (data, filePath, filename) {
  const localPath = join(__dirname, '..', '..', '..', '..', 'crawler-cache', filePath)
  const file = join(localPath, `${filename}.gz`)
  const compressed = gzipSync(data)
  fs.mkdirSync(localPath, { recursive: true })
  fs.writeFileSync(file, compressed)
  console.log(`Wrote to cache:`, file)
  return
}
