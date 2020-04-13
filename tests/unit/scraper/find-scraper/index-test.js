const { join } = require('path')
const test = require('tape')

const sut = join(process.cwd(), 'src', 'events', 'scraper', 'find-scraper', 'index.js')
const findScraper = require(sut)

test('Module exists', t => {
  t.plan(1)
  t.ok(findScraper, 'findScraper module exists')
})

const jan = '2020-01-01'
const feb = '2020-02-02'
const mar = '2020-03-01'

const source = {
  scrapers: [
    { startDate: jan },
    { startDate: feb },
    { startDate: mar }
  ]
}

test('Selects correct scraper', t => {
  t.plan(5)

  let date = '2019-12-31'
  t.throws(() => findScraper(source, date), 'Date prior to source existence throws')

  date = jan
  let result = findScraper(source, date)
  t.equal(result.startDate, jan, 'Scraper equal to a date selects that date')

  date = '2020-01-02'
  result = findScraper(source, date)
  t.equal(result.startDate, jan, 'Scraper selected a date within the correct range')

  date = '2020-02-01'
  result = findScraper(source, date)
  t.equal(result.startDate, jan, `Scraper selected a date in the next month, which contained another scraper (idk why not, it's easy enough to test)`)

  date = '2020-03-03'
  result = findScraper(source, date)
  t.equal(result.startDate, mar, `Scraper selected the final, open-ended scraper`)
})
