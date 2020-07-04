const fs = require('fs')
const { join } = require('path')

function write (params) {
  const { data, filename, folder } = params
  fs.mkdirSync(folder, { recursive: true })
  const file = join(folder, filename)
  fs.writeFileSync(file, data)
}


// TODO (reports) delete everything after this.

async function writeFile (filename, data) {
  let reportPath = join(__dirname, '..', '..', '..', '..', 'reports')
  // Alter the local cache dir (handy for integration testing)
  if (process.env.LI_REPORT_PATH) {
    reportPath = process.env.LI_REPORT_PATH
  }
  fs.mkdirSync(reportPath, { recursive: true })

  const file = join(reportPath, filename)
  fs.writeFileSync(file, data)
  console.log(`Wrote report:`, file)
}

function getWritableStream (filename) {
  let reportPath = join(__dirname, '..', '..', '..', '..', 'reports')
  // Alter the local cache dir (handy for integration testing)
  if (process.env.LI_REPORT_PATH) {
    reportPath = process.env.LI_REPORT_PATH
  }
  fs.mkdirSync(reportPath, { recursive: true })

  const file = join(reportPath, filename)
  return {
    writestream: fs.createWriteStream(file),
    promise: Promise.resolve(true)
  }
}

// eslint-disable-next-line no-unused-vars
async function copyFileToArchive (filename) {
  /* No-op for local */
}

module.exports = {
  write,
  writeFile,
  getWritableStream,
  copyFileToArchive
}
