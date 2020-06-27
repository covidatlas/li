/** Generate a report. */
async function generateReport (params) {
  const { report } = params
  switch (report) {
  case 'a':
    console.log('generating a')
    break
  case 'b':
    console.log('generating b')
    break
  default:
    throw new Error(`unknown report ${report}`)
  }
}

module.exports = generateReport
