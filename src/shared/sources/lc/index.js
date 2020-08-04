const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')

const country = 'iso1:LC'

module.exports = {
  country,
  timeseries: false,
  friendly: {
    name: "SAINT LUCIA'S COVID-19 DASHBOARD",
    url: 'https://www.covid19response.lc/'
  },
  maintainers: [ maintainers.appastair ],
  scrapers: [
    {
      startDate: '2020-06-04',
      crawl: [
        {
          type: 'page',
          url: 'https://www.covid19response.lc/',
          data: 'paragraph'
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
    },
    {
      startDate: '2020-07-11',
      crawl: [
        {
          type: 'page',
          url: 'https://www.covid19response.lc/',
          data: 'paragraph'
        },
      ],
      scrape ($) {
        const clean = s => s.trim().replace(/\n/g, '').replace(/ +/g, ' ')
        const stats = $('div.wrapper').
              toArray().
              map(w => $(w)).
              map(w => [ clean(w.find('div').eq(0).text()), clean(w.find('div.yellow').text()) ]).
              reduce((hsh, pair) => {
                hsh[pair[0]] = parseInt(pair[1].replace(/,/g, ''), 10)
                return hsh
              }, {})

        const data = {
          cases: stats['Number of Confirmed Cases of COVID-19 in Saint Lucia'],
          deaths: stats['Number of COVID-19 Deaths in Saint Lucia'],
          tested: stats['Number of COVID-19 Tests done in Saint Lucia'],
          recovered: stats['Number of Persons Recovered from COVID-19']
        }

        assert(data.cases > 0, 'Cases are not reasonable')

        return data
      }
    }
  ]

}
