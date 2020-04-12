const fs = require('fs')
const { join } = require('path')

module.exports = async function writeLocal (data, filePath, filename) {
  const localPath = join('crawler-cache', filePath)
  fs.mkdirSync(localPath, { recursive: true })
  fs.writeFileSync(join(localPath, filename), data)
  return
}
