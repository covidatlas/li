const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'events', 'scraper', 'load-cache', '_get-local-date-from-filename.js')
const getLocalDateFromFilename = require(sut)

test('Date parsed correctly', t => {
  const f = join('folder', 'subfolder', '2020-04-11t21_00_00.000z-default-117bb.html.gz')
  const result = getLocalDateFromFilename(f, 'utc')
  t.plan(1)
  t.equal('2020-04-11', result)
})

test('Bad cache filename throws', t => {
  const f = join('folder', 'subfolder', 'bad_filename')
  t.plan(1)
  try {
    getLocalDateFromFilename(f, 'utc')
    t.fail('should have thrown')
  } catch (err) {
    t.equal(err.message, 'Bad cache filename folder/subfolder/bad_filename')
  }
})


// TODO (cache-validation): this test belongs somewhere, but not here.
test('Filenames with bad keys throws', t => {
  const badnames = [ '', 'has space', 'UpperCase', '123' ]
  t.plan(badnames.length)
  badnames.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-{n}-117bb.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => getLocalDateFromFilename(f, 'utc'), `${n} name throws`)
  })
})

// TODO (cache-validation): this test belongs somewhere, but not here.
test('Missing or bad sha throws', t => {
  const badshas = [ '', '12 34', 'UPPER', '123' ]
  t.plan(badshas.length)
  badshas.forEach(n => {
    const s = `2020-04-11t21_00_00.000z-default-${n}.html.gz`
    const f = join('folder', 'subfolder', s)
    t.throws(() => getLocalDateFromFilename(f, 'utc'), `${n} sha throws`)
  })
})
