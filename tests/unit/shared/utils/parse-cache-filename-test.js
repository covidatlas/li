const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'shared', 'utils', 'parse-cache-filename.js')
const parse = require(sut)

// This tests the filenames of files coming out of the cache
// To see how we ensure the filenames going into the cache are correct
// SEE: `tests/unit/crawler/cache/_cache-namer-test.js`


test('parsing', t => {
  const filename = '2020-04-11t21_00_00.000z-default-117bb.html.gz'
  const p = parse(filename)
  const expected = {
    datetime: '2020-04-11t21_00_00.000z',
    name: 'default',
    sha: '117bb',
    extension: 'html'
  }
  t.deepEqual(p, expected)
  t.end()
})

test('Filename can have page counter after the cache key', t => {
  const baseExpected = {
    datetime: '2020-04-11t21_00_00.000z',
    name: 'default',
    sha: '117bb',
    extension: 'html'
  }
  for (let i = 0; i < 13; i++) {
    const filename = `2020-04-11t21_00_00.000z-default-${i}-117bb.html.gz`
    const p = parse(filename)
    const expected = { ...baseExpected, page: i }
    t.deepEqual(p, expected, filename)
  }
  t.end()
})

test('Filename page counter must be a number', t => {
  try {
    const filename = `2020-04-11t21_00_00.000z-default-BAD-117bb.html.gz`
    parse(filename)
    t.fail('should have thrown')
  } catch (err) {
    t.pass('Caught bad cache filename, err = ' + err)
  }
  t.end()
})

test('Filenames with bad date throws', t => {
  // Note missing a digit before the timezone.
  const filename = '2020-04-11t21_00_00.00z-default-117bb.html.gz'
  try {
    parse(filename)
    t.fail('should have thrown')
  } catch (err) {
    t.pass('Caught bad cache filename')
  }
  t.end()
})

test('Filenames (with file paths) with Bad cache filename throws', t => {
  try {
    parse('bad_filename')
    t.fail('should have thrown')
  } catch (err) {
    t.pass('Caught bad cache filename')
  }
  t.end()
})

test('Filenames with bad / missing extension throws', t => {
  const badexts = [ '', 'htm', 'UpperCase', '123' ]
  t.plan(badexts.length)
  badexts.forEach(n => {
    const filename = `2020-04-11t21_00_00.000z-default-117bb.${n}`
    t.throws(() => parse(filename), `${n} ext throws`)
  })
})

test('Filenames (with file paths) with bad keys throws', t => {
  const badnames = [ '', 'has space', 'UpperCase', '123' ]
  badnames.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-${n}-117bb.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => parse(f), `${n} name throws`)
  })
  t.end()
})

test('Filenames (with file paths) with missing or bad sha throws', t => {
  const badshas = [ '', '12 34', 'UPPER', '123' ]
  badshas.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-default-${n}.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => parse(f), `${n} sha throws`)
  })
  t.end()
})
