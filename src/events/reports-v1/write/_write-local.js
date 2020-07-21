const fs = require('fs')
const { join } = require('path')

function write (params) {
  const { data, filename, folder } = params
  const version = 'v1'
  fs.mkdirSync(join(folder, version), { recursive: true })
  const file = join(folder, version, filename)
  fs.writeFileSync(file, data)
}

module.exports = {
  write
}
