const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'locations', '_lib', 'load-locations.js')
const loadLocations = require(sut)

test('Set up', t => {
  t.plan(1)
  t.ok(loadLocations, 'loadLocations module exists')
})

test('Load locations', t => {
  t.plan(3)
  const result = loadLocations()
  t.ok(result instanceof Array, 'loadLocations returned an array')
  t.ok(result.length, 'loadLocations found some files')
  let hasUnderscore = result.some(r => r.includes('_'))
  t.notOk(hasUnderscore, `Returned files didn't have any underscores`)
})
