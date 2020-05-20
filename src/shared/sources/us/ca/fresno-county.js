// Migrated from coronadatascraper, src/shared/scrapers/US/CA/fresno-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'Fresno County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '1999-09-09',
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
    }
  ]
}


// TODO: delete unused requires
// TODO: fix 1999-09-09 start date
// TODO: fix 1999-09-09 scrape and crawl
