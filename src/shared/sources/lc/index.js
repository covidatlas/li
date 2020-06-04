const assert = require('assert')

const country = 'iso1:LC'

module.exports = {
  country,
  timeseries: false,
  friendly: {
    name: "SAINT LUCIA'S COVID-19 DASHBOARD",
    url: 'https://www.health.gov.au/'
  },
  scrapers: [
    {
      startDate: '2020-06-04',
      crawl: [
        {
          type: 'page',
          url: 'https://www.covid19response.lc/'
        },
      ],
      scrape ($) {
        const data = {
            cases: $('.confirm-cases-stlucia').text(),
            deaths: $('.death-stlucia').text(),
            tested: $('.test-stlucia').text(),
            recovered: $('.repart-stlucia').text(),
        }

        assert(data.cases > 0, 'Cases are not reasonable')

        return data
      }
    }
  ]

}
