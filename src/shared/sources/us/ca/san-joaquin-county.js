// Migrated from coronadatascraper, src/shared/scrapers/US/CA/san-joaquin-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')


module.exports = {
  county: 'fips:06077',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'http://www.sjcphs.org/coronavirus.aspx#res',
        },
      ],
      scrape ($) {
        const h3 = $('h6:contains("confirmed cases of COVID-19")')
              .first()
              .text()
        const cases = parse.number(h3.match(/\((\d+)\)/)[1])
        return { cases }
      }
    },
    {
      startDate: '2020-03-17',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'http://www.sjcphs.org/coronavirus.aspx#res',
        },
      ],
      scrape ($) {
        const $table = $('h3:contains("San Joaquin County COVID-19 Numbers at a Glance")').closest('table')
        const $headers = $table.find('tbody > tr:nth-child(2) > td')
        const $numbers = $table.find('tbody > tr:nth-child(3) > td')
        let cases = 0
        let deaths = 0
        $headers.each((index, td) => {
          const $td = $(td)
          if ($td.text().includes('Cases')) {
            cases = parse.number($numbers.eq(index).text())
          }
          if ($td.text().includes('Deaths')) {
            deaths = parse.number($numbers.eq(index).text())
          }
        })
        return {
          cases,
          deaths
        }
      }
    }
  ]
}
