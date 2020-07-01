const fs = require('fs')
const { join } = require('path')

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
  return fs.createWriteStream(file)
}

// eslint-disable-next-line no-unused-vars
async function copyFileToArchive (filename) {
  /* No-op for local */
}

module.exports = {
  writeFile,
  getWritableStream,
  copyFileToArchive
}
