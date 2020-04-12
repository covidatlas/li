const fs = require('fs')
const { join } = require('path')

module.exports = async function writeLocal (data, filePath, filename) {
  const localPath = join('crawler-cache', filePath)
  const file = join(localPath, filename)
  fs.mkdirSync(localPath, { recursive: true })
  fs.writeFileSync(file, data)
  console.log(`Wrote to cache:`, file)
  return
}
