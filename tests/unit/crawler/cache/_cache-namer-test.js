const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'events', 'crawler', 'cache', '_cache-namer.js')
const cacheNamer = require(sut)

// This tests the filenames of files going into the cache
// To see how we ensure the filenames coming out of the cache are correct,
// SEE: `tests/unit/shared/utils/validate-cache-filename-test.js`

test('Module exists', t => {
  t.plan(1)
  t.ok(cacheNamer, 'cacheNamer module exists')
})

test('Generate some filenames', t => {
  t.plan(14)

  // Date breakdown
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString().padStart(2, '0')
  const date = now.getUTCDate().toString().padStart(2, '0')
  const iso = now.toISOString().substr(0,10)

  let _sourceKey = 'a-place'
  let _name = 'default'
  let data = Buffer.from('hi there')
  let type = 'page'
  let params = { _sourceKey, _name, data, type }
  let { filepath, filename } = cacheNamer(params)

  // Filepath
  let parts = filepath.split('/')
  t.equal(parts[0], _sourceKey, 'Filepath root folder matches')
  t.equal(parts[1], iso, 'Filepath date folder matches')

  // Filename
  parts = filename.split('-')

  // Do a little parts analysis
  // YYYY-MM-DD
  t.equal(parts[0], year, 'Year matches')
  t.ok(parts[1], month, 'Month matches')
  t.equal(parts[2].substr(0, 2), date, 'Date matches')

  // Filename: the timestamp
  const ts = parts[2].substr(2)
  t.ok(ts.startsWith('t'), 'Timestamp begins with lowercase t')
  t.equal(ts.length, 14, 'Timestamp is 8601Z length')
  t.ok(ts.endsWith('z'), 'Timestamp ends with lowercase z')

  // Filename: the other bits
  t.equal(parts[3], _name, 'name matches')
  t.equal(parts[4].split('.')[0], '9b96a', 'Hash appended')
  t.equal(parts[4].split('.')[1], 'html', 'Correct extension')

  // Filename: the other bits, redeux
  _name = 'cases'
  data = Buffer.from('howdy')
  type = 'json'
  params = { _sourceKey, _name, data, type }

  ;({ filename } = cacheNamer(params))
  parts = filename.split('-')
  t.equal(parts[3], _name, 'name matches')
  t.equal(parts[4].split('.')[0], '0f112', 'Hash appended')
  t.equal(parts[4].split('.')[1], type, 'Correct extension')
})
