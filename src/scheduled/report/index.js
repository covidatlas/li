const scan = require('./scan/index.js')
const getCaseData = require('./get-case-data/index.js')

async function report () {
  /**
   * Read out the entire locations database maybe
   */
  const locations = await scan('locations')

  await getCaseData(locations)
}

exports.handler = report
