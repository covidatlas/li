// Migrated from coronadatascraper, src/shared/scrapers/US/CA/placer-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06061',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
        },
      ],
      scrape ($) {
        const $table = $('p:contains("Confirmed COVID-19 Cases in Placer County")')
              .nextAll('table')
              .first()
        return {
          cases: parse.number(
            $table
              .find('td:contains("Positive Tests")')
              .closest('tr')
              .find('td:last-child')
              .text()
          ),
          deaths: parse.number(
            $table
              .find('td:contains("Deaths")')
              .closest('tr')
              .find('td:last-child')
              .text()
          )
        }
      }
    },
    {
      startDate: '2020-03-28',
      crawl: [
        {
          type: 'page',
          url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
        },
      ],
      scrape ($) {
        return {
          cases: parse.number(
            $('td:contains("Cases")')
              .next('td')
              .text()
          ),
          deaths: parse.number(
            $('td:contains("Deaths")')
              .next('td')
              .text()
          )
        }
      }
    },
    {
      startDate: '2020-04-06',
      crawl: [
        {
          type: 'page',
          url: 'https://www.placer.ca.gov/6448/Cases-in-Placer',
        },
      ],
      // eslint-disable-next-line
      scrape ($) {
        // TODO (scraper): as at about 2020-04-06, the url redirects to arcgis
        // (as of May 20, https://placer.maps.arcgis.com/apps/opsdashboard/ ...
        //   index.html#/2e0154ae8a764c2fb8cccc5b58d5ce8e).  The url
        // is no longer valid for case data.
        return {
          cases: undefined,
          deaths: undefined
        }
      }
    }
  ]
}
