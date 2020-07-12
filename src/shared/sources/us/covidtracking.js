// Migrated from coronadatascraper, src/shared/scrapers/US/covidtracking.js

const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')
const transform = require('../_lib/transform.js')

module.exports = {
  country: 'iso1:US',
  curators: [
    {
      name: 'The COVID Tracking Project',
      url: 'https://covidtracking.com/',
      twitter: '@COVID19Tracking',
      github: 'COVID19Tracking',
    },
  ],
  maintainers: [ maintainers.jzohrab ],
  tz: 'America/Los_Angeles',
  timeseries: true,
  aggregate: 'state',
  priority: 0.5,
  scrapers: [
    {
      startDate: '2020-01-22',
      crawl: [
        {
          type: 'json',
          url: 'https://covidtracking.com/api/v1/states/daily.json',
        },
      ],
      scrape (data, date) {

        // api reports date as YYYYMMDD, eg 20200130  (integer)
        function toYYYYMMDD (n) {
          const s = `${n}`
          return [ s.slice(0, 4), s.slice(4, 6), s.slice(-2) ].join('-')
        }

        const { filterDate, func } = timeseriesFilter(data, 'date', toYYYYMMDD, date)

        const regions = data.filter(func).map(d => {
          const result = {
            state: `iso2:US-${d.state}`,
            date: filterDate
          }

          const mappings = [
            [ 'positive', 'cases' ],
            [ 'death', 'deaths' ],
            [ 'hospitalizedCumulative', 'hospitalized' ],
            [ 'hospitalizedCurrently', 'hospitalized_current' ],
            [ 'inIcuCumulative', 'icu' ],
            [ 'inIcuCurrently', 'icu_current' ],
            [ 'recovered', 'recovered' ]
          ]
          mappings.forEach(mapping => {
            const [ src, dest ] = mapping
            const v = d[src]
            if (v !== null && v !== undefined)
              result[dest] = parse.number(v)
          })

          const testingParts = [ 'positive', 'negative', 'pending' ]
          const hasTested = testingParts.map(f => d[f]).some(v => v !== null && v !== undefined)
          if (hasTested)
            result.tested = testingParts.reduce((sum, f) => sum + (d[f] || 0), 0)

          return result
        })

        regions.push({ ...transform.sumData(regions), date: filterDate })
        return regions
      }
    }
  ]
}
