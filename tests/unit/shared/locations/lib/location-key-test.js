const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'locations', '_lib', 'location-key.js')
const locationKey = require(sut)

test('Set up', t => {
  t.plan(1)
  t.ok(locationKey, 'locationKey module exists')
})

test('Load locations', t => {
  t.plan(5)
  let filePath = `/users/person/covidatlas/li/src/shared/locations/jhu/index.js`
  let result = locationKey(filePath)
  t.equal(result, 'jhu', `Key derived from local filesystem + jhu/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/events/crawler/node_modules/@architect/shared/locations/jhu/index.js`
  result = locationKey(filePath)
  t.equal(result, 'jhu', `Key derived from nested node_modules + jhu/index.js: ${result}`)

  filePath = `/var/task/node_modules/@architect/shared/locations/jhu/index.js`
  result = locationKey(filePath)
  t.equal(result, 'jhu', `Key derived from Lambda-esque path + jhu/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/shared/locations/us/ca/index.js`
  result = locationKey(filePath)
  t.equal(result, 'us-ca', `Key derived from nested us/ca/index.js: ${result}`)

  filePath = `/users/person/covidatlas/li/src/shared/locations/us/ca/san-francisco-county.js`
  result = locationKey(filePath)
  t.equal(result, 'us-ca-san-francisco-county', `Key derived from us/ca/san-francisco-county.js: ${result}`)
})
