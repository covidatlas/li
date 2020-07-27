// Ported from https://github.com/covidatlas/coronadatascraper/pull/1052

const maintainers = require('../../_lib/maintainers.js')

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-CA',
  county: 'fips:06075',
  timeseries: true,
  maintainers: [ maintainers.jbencina, maintainers['1ec5'], maintainers.jzohrab ],
  friendly: {
    name: 'SF Department of Public Health',
    url: 'https://www.sfdph.org/dph/alerts/coronavirus.asp'
  },
  scrapers: [
    {
      startDate: '2020-03-12',
      crawl: [
        {
          type: 'json',
          name: 'base',
          url: 'https://data.sfgov.org/resource/tvq9-ec9w.json'
        },
        {
          type: 'json',
          name: 'tests',
          url: 'https://data.sfgov.org/resource/nfpa-mg4g.json'
        }
        // There is another URL that appears to have some
        // hospitalization data,
        // https://data.sfgov.org/resource/nxjg-bhem.json, but I'm not
        // sure how to use it.
      ],
      scrape ({ base, tests }, date) {
        function filterBy (f) {
          return function (c) {
            return c[f].split('T')[0] <= date
          }
        }
        const baseToNow = base.filter(filterBy('specimen_collection_date'))
        if (baseToNow.length === 0)
          throw new Error(`No data as at ${date}`)

        const cases = baseToNow.
              filter(c => c.case_disposition === 'Confirmed').
              reduce((sum, c) => sum + parseInt(c.case_count, 10), 0)
        const deaths = baseToNow.
              filter(c => c.case_disposition === 'Death').
              reduce((sum, c) => sum + parseInt(c.case_count, 10), 0)
        const tested = tests.
              filter(filterBy('specimen_collection_date')).
              reduce((sum, c) => sum + parseInt(c.tests, 10), 0)

        // Assuming that the base has the latest data, and we can use
        // its latest date as the date of the result set.
        const maxDateEntry = baseToNow.sort((a, b) => {
          const ad = a.specimen_collection_date
          const bd = b.specimen_collection_date
          if (ad === bd)
            return 0
          return (ad < bd ? -1 : 1)
        }).slice(-1)[0]
        const maxDate = maxDateEntry.specimen_collection_date.split('T')[0]

        const result = {
          cases,
          deaths,
          tested,
          date: maxDate
        }

        return result
      }
    }
  ]
}
