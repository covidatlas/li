const fs = require('fs')
const { join } = require('path')

module.exports = async function writeLocal (data, filename) {
  let reportPath = join(__dirname, '..', '..', '..', 'reports')
  // Alter the local cache dir (handy for such things as integration testing)
  if (process.env.LI_REPORT_PATH) {
    reportPath = process.env.LI_REPORT_PATH
  }
  fs.mkdirSync(reportPath, { recursive: true })

  const file = join(reportPath, filename)
  fs.writeFileSync(file, data)
  console.log(`Wrote report:`, file)
}
