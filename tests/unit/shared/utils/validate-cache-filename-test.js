const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'shared', 'utils', 'validate-cache-filename.js')
const validate = require(sut)

// This tests the filenames of files coming out of the cache
// To see how we ensure the filenames going into the cache are correct
// SEE: `tests/unit/crawler/cache/_cache-namer-test.js`

// This uses parse-cache-filename, so most of the scenarios are
// covered already in parse-cache-filename-test.

test('Date parsed correctly', t => {
  t.plan(1)
  const filename = '2020-04-11t21_00_00.000z-default-117bb.html.gz'
  validate(filename)
  t.pass('We good')
})

test('Filenames with bad / missing extension throws', t => {
  const badexts = [ '', 'htm', 'UpperCase', '123' ]
  t.plan(badexts.length)
  badexts.forEach(n => {
    const filename = `2020-04-11t21_00_00.000z-default-117bb.${n}`
    t.throws(() => validate(filename), `${n} ext throws`)
  })
})
