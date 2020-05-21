// Migrated from coronadatascraper, src/shared/scrapers/US/CA/san-mateo-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

module.exports = {
  county: 'fips:06081',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'https://www.smchealth.org/coronavirus',
        },
      ],
      scrape ($) {
        // TODO (scrapers) Validate structure.
        let deaths
        let cases
        const $th = $('th:contains("COVID-19 Case Count")')
        const $table = $th.closest('table')
        {
          const $tr = $table.find('*:contains("Positive")').closest('tr')
          const $dataTd = $tr.find('td:last-child')
          cases = parse.number($dataTd.text())
        }
        {
          const $tr = $table.find('*:contains("Deaths")').closest('tr')
          const $dataTd = $tr.find('td:last-child')
          deaths = parse.number($dataTd.text())
        }
        return {
          cases,
          deaths
        }
      }
    }
  ]
}
