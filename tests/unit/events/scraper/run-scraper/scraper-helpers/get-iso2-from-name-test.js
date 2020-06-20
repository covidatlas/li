const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'events', 'scraper', 'run-scraper', 'scraper-helpers', 'get-iso2-from-name.js')
const getIso2FromName = require(sut)

test('looks up iso2 code for Victoria in AU', t => {
  t.plan(1)
  t.strictEqual(getIso2FromName({ country: 'iso1:AU', name: 'Victoria' }), 'iso2:AU-VIC')
})

test('looks up iso2 code for Hokkaido (country-levels has Hokkaidō)', t => {
  t.plan(1)
  t.strictEqual(getIso2FromName({ country: 'iso1:JP', name: 'Hokkaido' }), 'iso2:JP-01')
})
