const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'sources', '_lib', 'source-key.js')
const sourceKey = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(sourceKey, 'sourceKey module exists')
})

test('Load sources', t => {
  t.plan(5)
  let filePath = `/users/person/covidatlas/li/src/shared/sources/jhu/index.js`
  let result = sourceKey(filePath)
  t.equal(result, 'jhu', `Key derived from local filesystem + jhu/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/events/crawler/node_modules/@architect/shared/sources/jhu/index.js`
  result = sourceKey(filePath)
  t.equal(result, 'jhu', `Key derived from nested node_modules + jhu/index.js: ${result}`)

  filePath = `/var/task/node_modules/@architect/shared/sources/jhu/index.js`
  result = sourceKey(filePath)
  t.equal(result, 'jhu', `Key derived from Lambda-esque path + jhu/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/shared/sources/us/ca/index.js`
  result = sourceKey(filePath)
  t.equal(result, 'us-ca', `Key derived from nested us/ca/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/shared/sources/us/ca/san-francisco-county.js`
  result = sourceKey(filePath)
  t.equal(result, 'us-ca-san-francisco-county', `Key derived from us/ca/san-francisco-county.js: ${result}`)
})
