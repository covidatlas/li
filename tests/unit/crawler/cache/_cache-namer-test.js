const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'events', 'crawler', 'cache', '_cache-namer.js')
const cacheNamer = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(cacheNamer, 'cacheNamer module exists')
})

test('Generate some filenames', t => {
  t.plan(14)

  // Date breakdown
  const now = new Date()
  const year = now.getUTCFullYear().toString()
  const month = (now.getUTCMonth() + 1).toString()
  const date = now.getUTCDate().toString()
  const iso = now.toISOString().substr(0,10)

  let _sourceKey = 'a-place'
  let _name = 'default'
  let data = new Buffer.from('hi there')
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
  t.ok(parts[1].endsWith(month), 'Month matches') // Hacky test deals with padding
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
  data = new Buffer.from('howdy')
  type = 'json'
  params = { _sourceKey, _name, data, type }

  ;({ filename } = cacheNamer(params))
  parts = filename.split('-')
  t.equal(parts[3], _name, 'name matches')
  t.equal(parts[4].split('.')[0], '0f112', 'Hash appended')
  t.equal(parts[4].split('.')[1], type, 'Correct extension')
})
