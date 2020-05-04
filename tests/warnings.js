/** Print any test warnings to console. */

var path = require('path')
var fs = require('fs')

const testFile = path.join(process.cwd(), 'test-results.txt')
const data = fs.readFileSync(testFile, 'utf-8')

const warnings = data.split('\n').filter(s => s.match(/^warning/i))

if (warnings.length > 0) {
  console.warn('\n------------------------------------------------------------\n')
  console.warn(`⚠️  ${warnings.length} Warnings:`)
  for (const warn of warnings) {
    console.warn(' ' + warn)
  }
  console.warn('')
}
