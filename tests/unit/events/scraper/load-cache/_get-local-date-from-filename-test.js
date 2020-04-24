const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'shared', 'utils', 'validate-cache-filename.js')
const validate = require(sut)

test('Date parsed correctly', t => {
  t.plan(1)
  const f = '2020-04-11t21_00_00.000z-default-117bb.html.gz'
  validate(f)
  t.pass('We good')
})

test('Bad cache filename throws', t => {
  t.plan(1)
  try {
    validate('bad_filename')
    t.fail('should have thrown')
  } catch (err) {
    t.equal(err.message, 'Bad cache filename folder/subfolder/bad_filename')
  }
})

test.only('Filenames with bad / missing extension throws', t => {
  const badexts = [ '', 'html', 'UpperCase', '123' ]
  t.plan(badexts.length)
  badexts.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-default-117bb.${n}`
    t.throws(() => validate(s), `${n} ext throws`)
  })
})

test('Filenames with bad keys throws', t => {
  const badnames = [ '', 'has space', 'UpperCase', '123' ]
  t.plan(badnames.length)
  badnames.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-${n}-117bb.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => validate(f), `${n} name throws`)
  })
})

test('Missing or bad sha throws', t => {
  const badshas = [ '', '12 34', 'UPPER', '123' ]
  t.plan(badshas.length)
  badshas.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-default-${n}.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => validate(f), `${n} sha throws`)
  })
})
