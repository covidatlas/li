const fs = require('fs')
const { join } = require('path')

function write (params) {
  const { data, filename, folder } = params
  fs.mkdirSync(folder, { recursive: true })
  const file = join(folder, filename)
  fs.writeFileSync(file, data)
}

module.exports = {
  write
}
