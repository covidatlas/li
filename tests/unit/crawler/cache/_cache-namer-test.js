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

test('cacheFolder', t => {
  // Date breakdown
  const now = new Date()
  const iso = now.toISOString().substr(0,10)

  let _sourceKey = 'a-place'

  let filepath = cacheNamer.cacheFolder({ _sourceKey })
  let parts = filepath.split('/')
  t.equal(parts[0], _sourceKey, 'Filepath root folder matches')
  t.equal(parts[1], iso, 'Filepath date folder matches')
  t.match(parts[2], /^\d{2}_\d{2}_\d{2}.\d{3}z$/, 'Time part matches')
  t.end()
})

test('Generate some filenames', t => {
  let _name = 'default'
  let data = Buffer.from('hi there')
  let type = 'page'
  let params = { _name, data, type }
  let filename = cacheNamer.cacheNamer(params)

  // Filename
  let parts = filename.split('-')

  // Filename: the other bits
  t.equal(parts[0], _name, 'name matches')
  t.equal(parts[1].split('.')[0], '9b96a', 'Hash appended')
  t.equal(parts[1].split('.')[1], 'html', 'Correct extension')
  t.end()
})
