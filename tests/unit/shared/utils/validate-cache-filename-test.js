const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'shared', 'utils', 'validate-cache-filename.js')
const validate = require(sut)

// This tests the filenames of files coming out of the cache
// To see how we ensure the filenames going into the cache are correct
// SEE: `tests/unit/crawler/cache/_cache-namer-test.js`

test('Module exists', t => {
  t.plan(1)
  t.ok(validate, 'validate module exists')
})

test('Date parsed correctly', t => {
  t.plan(1)
  const filename = '2020-04-11t21_00_00.000z-default-117bb.html.gz'
  validate(filename)
  t.pass('We good')
})

test('Filenames (with file paths) with Bad cache filename throws', t => {
  t.plan(1)
  try {
    validate('bad_filename')
    t.fail('should have thrown')
  } catch (err) {
    t.pass('Caught bad cache filename')
  }
})

test('Filenames with bad / missing extension throws', t => {
  const badexts = [ '', 'htm', 'UpperCase', '123' ]
  t.plan(badexts.length)
  badexts.forEach(n => {
    const filename = `2020-04-11t21_00_00.000z-default-117bb.${n}`
    t.throws(() => validate(filename), `${n} ext throws`)
  })
})

test('Filenames (with file paths) with bad keys throws', t => {
  const badnames = [ '', 'has space', 'UpperCase', '123' ]
  t.plan(badnames.length)
  badnames.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-${n}-117bb.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => validate(f), `${n} name throws`)
  })
})

test('Filenames (with file paths) with missing or bad sha throws', t => {
  const badshas = [ '', '12 34', 'UPPER', '123' ]
  t.plan(badshas.length)
  badshas.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-default-${n}.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => validate(f), `${n} sha throws`)
  })
})
