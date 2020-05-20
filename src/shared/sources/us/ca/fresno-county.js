// Migrated from coronadatascraper, src/shared/scrapers/US/CA/fresno-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06019',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-14',
      crawl: [
        {
          type: 'page',
          url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
        },
      ],
      scrape ($) {
        return {
          cases: parse.number(
            $('li:contains("Total cases")')
              .children()
              .remove()
              .end()
              .text()
          ),
          deaths: parse.number($('li:contains("Total deaths")').text())
        }
      }
    },
    {
      startDate: '2020-04-09',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://www.co.fresno.ca.us/departments/public-health/covid-19',
        },
      ],
      scrape ($) {
        const liText = $('li').toArray().
              map(li => $(li).text()).
              map(s => s.trim())

        const regexes = {
          cases: /^Total Cases: ([\d,]*)/,
          deaths: /^Total Deaths: ([\d,]*)/,
          recovered: /^Recovered: ([\d,]*)/,
          tested: /^Test Results.*?: ([\d,]*)/
        }
        const result = Object.keys(regexes).reduce((hsh, key) => {
          const re = regexes[key]
          const li = liText.find(t => t.match(re))
          if (li)
            hsh[key] = parse.number(li.match(re)[1])
          return hsh
        }, {})
        return result
      }
    }
  ]
}
