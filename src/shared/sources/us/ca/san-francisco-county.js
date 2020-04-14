const parse = require('../../_lib/parse.js')
const maintainers = require('../../_lib/maintainers.js')

module.exports = {
  county: 'San Francisco County',
  state: 'CA',
  country: 'iso1:US',
  maintainers: [maintainers.jbencina],
  scrapers: [
    {
      startDate: '2020-03-01',
      friendly: {
        name: 'SF Department of Public Health',
        url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp'
      },
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp',
        }
      ],
      scrape($) {
        let deaths
        let cases
        const $h2 = $('h2:contains("Cases in San Francisco")')
        {
          const $p = $h2.nextAll('*:contains("Cases:")')
          cases = parse.number($p.text())
        }
        {
          const $p = $h2.nextAll('*:contains("Deaths:")')
          deaths = parse.number($p.text())
        }
        return {
          cases,
          deaths
        }
      }
    }
  ]
}
