// Migrated from coronadatascraper, src/shared/scrapers/US/CA/ventura-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06111',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'headless',
          url: 'https://www.ventura.org/covid19/',
        },
      ],
      scrape ($) {
        let cases = 0
        let tested = 0
        cases += parse.number(
          $('.count-subject:contains("Positive travel-related case")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        )
        cases += parse.number(
          $('.count-subject:contains("Presumptive Positive")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        )
        tested = parse.number(
          $('.count-subject:contains("People tested")')
            .closest('.hb-counter')
            .find('.count-number')
            .attr('data-from')
        )
        return { cases, tested }
      }
    },
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'headless',
          url: 'https://www.ventura.org/covid19/',
        },
      ],
      scrape ($) {
        let cases = 0
        let tested = 0
        cases += parse.number(
          $('td:contains("Positive cases")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        cases += parse.number(
          $('td:contains("Presumptive positive")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        tested = parse.number(
          $('td:contains("People tested")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        return { cases, tested }
      }
    },
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'page',
          url: 'https://www.ventura.org/covid19/',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('td:contains("COVID-19 Cases")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        return { cases }
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'page',
          url: 'https://www.vcemergency.com',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('td:contains("COVID-19 Cases")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        const deaths = parse.number(
          $('td:contains("Death")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        return { cases, deaths }
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'page',
          url: 'https://www.vcemergency.com',
        },
      ],
      scrape ($) {
        const cases = parse.number(
          $('td:contains("Positive Cases")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        const deaths = parse.number(
          $('td:contains("Death")')
            .closest('table')
            .find('td')
            .first()
            .text()
        )
        return { cases, deaths }
      }
    },
    {
      startDate: '2020-03-26',
      crawl: [
        {
          type: 'page',
          url: 'https://www.vcemergency.com',
        },
      ],
      scrape ($) {
        const positiveCases = $('td:contains("Positive Cases")').closest('tr')
        if (positiveCases.text() !== 'Positive Cases') {
          throw new Error('Unexpected table layout/labels')
        }
        if (
          positiveCases
            .next()
            .next()
            .text() !== 'Deaths'
        ) {
          throw new Error('Unexpected table layout/labels')
        }
        const cases = parse.number(positiveCases.prev().text())
        const deaths = parse.number(positiveCases.next().text())
        return { cases, deaths }
      }
    },
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'page',
          url: 'https://www.vcemergency.com',
        },
      ],
      scrape ($) {
        function valueFor (heading) {
          const v = $(`td:contains("${heading}")`)
            .first()
            .next()
            .text()
          return parse.number(v)
        }
        return {
          cases: valueFor('TOTAL CASES'),
          deaths: valueFor('DEATHS'),
          recovered: valueFor('Recovered Cases'),
          tested: valueFor('People Tested'),
          hospitalized: valueFor('Hospitalized')
        }
      }
    }
  ]
}
