const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'sources', '_lib', 'load-sources.js')
const loadSources = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(loadSources, 'loadSources module exists')
})

test('Load sources', t => {
  t.plan(3)
  const result = loadSources()
  t.ok(result instanceof Array, 'loadSources returned an array')
  t.ok(result.length, 'loadSources found some files')
  let hasUnderscore = result.some(r => r.includes('_'))
  t.notOk(hasUnderscore, `Returned files didn't have any underscores`)
})
