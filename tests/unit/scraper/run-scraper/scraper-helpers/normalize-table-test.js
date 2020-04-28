const { join } = require('path')
const test = require('tape')
const cheerio = require('cheerio')

const sut = join(process.cwd(), 'src', 'events', 'scraper', 'run-scraper', 'scraper-helpers', 'normalize-table.js')
const normalizeTable = require(sut)

test('one row without spans', t => {
  t.plan(1)
  const $ = cheerio.load('<table><tr><td>Howdy</td><td>Folks</td></tr></table>')
  const tableSelector = 'table'

  t.deepEqual(normalizeTable({ $, tableSelector }), [ [ 'Howdy', 'Folks' ] ])
})

test('one row with spans', t => {
  t.plan(1)
  const $ = cheerio.load('<table><tr><td colspan="2">Howdy</td><td>Folks</td></tr></table>')
  const tableSelector = 'table'

  t.deepEqual(normalizeTable({ $, tableSelector }), [ [ 'Howdy', 'Howdy', 'Folks' ] ])
})

test('two rows without spans', t => {
  t.plan(1)
  const $ = cheerio.load('<table><tr><td>Howdy</td><td>Folks</td></tr><tr><td>Howdy</td><td>Folks</td></tr></table>')
  const tableSelector = 'table'

  t.deepEqual(normalizeTable({ $, tableSelector }), [ [ 'Howdy', 'Folks' ], [ 'Howdy', 'Folks' ] ])
})
test('two rows with span', t => {
  t.plan(1)
  const $ = cheerio.load('<table><tr><td rowspan="2">Howdy</td><td>Folks</td></tr><tr><td>Folks</td></tr></table>')
  const tableSelector = 'table'

  t.deepEqual(normalizeTable({ $, tableSelector }), [ [ 'Howdy', 'Folks' ], [ 'Howdy', 'Folks' ] ])
})
