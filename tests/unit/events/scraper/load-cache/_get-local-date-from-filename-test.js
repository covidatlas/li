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
