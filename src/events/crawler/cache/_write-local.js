const fs = require('fs')
const { join } = require('path')
const { gzipSync } = require('zlib')

module.exports = async function writeLocal (data, filePath, filename) {
  let cachePath = join(__dirname, '..', '..', '..', '..', 'crawler-cache')
  if (process.env.LI_CACHE_PATH) {
    cachePath = process.env.LI_CACHE_PATH
  }
  const localPath = join(cachePath, filePath)
  const file = join(localPath, `${filename}.gz`)
  const compressed = gzipSync(data)
  fs.mkdirSync(localPath, { recursive: true })
  fs.writeFileSync(file, compressed)
  console.log(`Wrote to local cache:`, file)
  return
}
