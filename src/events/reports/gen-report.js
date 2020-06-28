const getWrite = require('./write/index.js')

/** Generate a report. */
async function generateReport (params) {
  const { report } = params
  let data = null
  let filename = null

  switch (report) {

  case 'a':
    console.log('generating a')
    data = JSON.stringify({ a: 1, a2: 2, a3: 3 }, null, 2)
    filename = 'a.json'
    break

  case 'b':
    console.log('generating b')
    data = `b1,b2,b3
1,2,3
4,5,6`
    filename = 'b.csv'
    break

  default:
    throw new Error(`unknown report ${report}`)
  }

  const write = getWrite()
  await write(data, filename)
}

module.exports = generateReport
