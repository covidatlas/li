const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'sources', '_lib', 'source-map.js')
const sourceMap = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(sourceMap, 'sourceMap module exists')
})

test('Load sources', t => {
  t.plan(3)
  const result = sourceMap()
  t.ok(result instanceof Object, 'sourceMap returned an object')
  t.ok(Object.keys(result).length, 'sourceMap found some files')
  let hasUnderscore = Object.values(result).some(r => r.includes('_'))
  t.notOk(hasUnderscore, `Returned files didn't have any underscores`)
})
