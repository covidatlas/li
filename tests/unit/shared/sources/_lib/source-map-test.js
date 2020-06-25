const test = require('tape')
const { join } = require('path')
const sut = join(process.cwd(), 'src', 'shared', 'sources', '_lib', 'source-map.js')
const sourceMap = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(sourceMap, 'sourceMap module exists')
})

test('Load sources', t => {
  t.plan(4)
  const result = sourceMap()
  t.ok(result instanceof Object, 'sourceMap returned an object')
  t.ok(Object.keys(result).length, 'sourceMap found some files')
  const hasUnderscore = Object.values(result).some(r => r.includes('_'))
  t.notOk(hasUnderscore, `Returned files didn't have any underscores`)
  // Ensure paths are valid per-platform
  const filePaths = Object.values(result)
  if (process.platform === 'win32') {
    const ok = filePaths.every(r => r.includes('\\') && !r.includes('/'))
    t.ok(ok, 'Paths use correct folder delimiters')
  }
  else {
    const ok = filePaths.every(r => r.includes('/') && !r.includes('\\'))
    t.ok(ok, 'Paths use correct folder delimiters')
  }
})

/** During some integration testing, it's useful to refer to fake
 * sources that we have completely under our control. */
test('Source dir can be overridden', t => {
  t.plan(1)
  const d = join(process.cwd(), 'tests', 'integration', 'fake-sources')
  const keys = Object.keys(sourceMap({ _sourcesPath: d }))
  t.ok(keys.includes('json-source'), `should have json-source in keys [ ${keys.join()} ]`)
})
