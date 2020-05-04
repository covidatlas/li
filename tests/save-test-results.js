/** Save the test results to an ignored file for later checking. */

var readline = require('readline')
var path = require('path')
var fs = require('fs')

const testFile = path.join(process.cwd(), 'test-results.txt')

fs.writeFileSync(testFile, `Test results as at ${new Date()}\n`)

/**
 * Main.
 */

/** Reader of stdin */
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
})

rl.on('line', function (line) {
  fs.writeFileSync(testFile, `${line}\n`, { flag: 'a' })
  console.log(line)
})
