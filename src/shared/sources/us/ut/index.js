const parse = require('../../_lib/parse.js')
const transform = require('../../_lib/transform.js')
const geography = require('../../_lib/geography.js')

// Set county to this if you only have state data, but this isn't the entire state
// const UNASSIGNED = '(unassigned)';

module.exports = {
  state: 'UT',
  country: 'iso1:US',
  aggregate: 'county',
  scrapers: [
    {
      startDate: '2020-01-01',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://coronavirus.utah.gov/latest/'
        }
      ],
      scrape ($) {
        let counties = []
        const $table = $('th:contains("District")').closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const county = parse.string($tr.find('td:first-child').text())
          const cases = parse.number($tr.find('td:last-child').text())
          if (index > 0 && !county.includes('Non-Utah')) {
            _ut.maybeAggregateCounties(counties, county, cases)
          }
        })

        // Backfill any named counties without data
        counties = geography.addEmptyRegions(counties, _ut.counties, 'county')

        counties.push(transform.sumData(counties))

        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://coronavirus-dashboard.utah.gov/'
        }
      ],
      scrape ($) {
        let counties = []

        const script = $('script[type="application/json"]').html()
        const { data } = JSON.parse(script).x

        for (const [index, county] of Object.entries(data[0])) {
          _ut.maybeAggregateCounties(counties, county, parse.number(data[1][index]) + parse.number(data[2][index]))
        }

        // Totals come from here
        counties.push({
          tested: parse.number($('#reported-people-tested .value-output').text()),
          cases: parse.number($('#covid-19-cases .value-output').text()),
          deaths: parse.number($('#covid-19-deaths .value-output').text()),
          hospitalized: parse.number($('#ccovid-19-hospitalizations .value-output').text())
        })

        // Backfill any named counties without data
        counties = geography.addEmptyRegions(counties, _ut.counties, 'county')

        // We don't sum data because we already have totals from above
        return counties
      }
    },
    {
      startDate: '2020-04-08',
      friendly: {
        url: 'https://health.utah.gov/',
        name: 'Utah Department of Health'
      },
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://coronavirus-dashboard.utah.gov/'
        }
      ],
      scrape ($) {
        let counties = []

        const script = $('script[type="application/json"]').html()
        const { data } = JSON.parse(script).x

        for (const [index, county] of Object.entries(data[0])) {
          _ut.maybeAggregateCounties(counties, county, parse.number(data[1][index]) + parse.number(data[2][index]))
        }

        // Totals come from here
        counties.push({
          tested: parse.number($('#total-reported-people-tested .value-output').text()),
          cases: parse.number($('#total-covid-19-cases .value-output').text()),
          deaths: parse.number($('#total-covid-19-deaths .value-output').text()),
          hospitalized: parse.number($('#total-covid-19-hospitalizations .value-output').text())
        })

        // Backfill any named counties without data
        counties = geography.addEmptyRegions(counties, _ut.counties, 'county')

        // We don't sum data because we already have totals from above
        return counties
      }
    }
  ]
}

const _ut = {
  counties: [
    // 'Beaver County',
    // 'Box Elder County',
    // 'Cache County',
    // 'Carbon County',
    // 'Daggett County',
    'Davis County',
    // 'Duchesne County',
    // 'Emery County',
    // 'Garfield County',
    // 'Grand County',
    // 'Iron County',
    // 'Juab County',
    // 'Kane County',
    // 'Millard County',
    // 'Morgan County',
    // 'Piute County',
    // 'Rich County',
    'Salt Lake County',
    'San Juan County',
    // 'Sanpete County',
    // 'Sevier County',
    'Summit County',
    'Tooele County',
    // 'Uintah County',
    'Utah County',
    'Wasatch County'
    // 'Washington County',
    // 'Wayne County'
    // 'Weber County'
  ],
  maybeAggregateCounties(counties, county, cases) {
    if (county === 'State Total') {
      return
    }
    if (county === 'TriCounty' || county === 'Tri County') {
      const aggCounties = ['Uintah County', 'Duchesne County', 'Daggett County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'TriCounty Utah',
          cases
        })
      })
      return
    }
    if (county === 'Weber-Morgan') {
      const aggCounties = ['Weber County', 'Morgan County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'Weber-Morgan Utah',
          cases
        })
      })
      return
    }
    if (county === 'Southeast Utah') {
      const aggCounties = ['Carbon County', 'Emery County', 'Grand County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'Southeast Utah',
          cases
        })
      })
      return
    }
    if (county === 'Southwest Utah') {
      const aggCounties = ['Beaver County', 'Garfield County', 'Iron County', 'Kane County', 'Washington County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'Southwest Utah',
          cases
        })
      })
      return
    }
    if (county === 'Central Utah') {
      const aggCounties = ['Juab County', 'Millard County', 'Piute County', 'Sanpete County', 'Sevier County', 'Wayne County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'Central Utah',
          cases
        })
      })
      return
    }
    if (county === 'Bear River') {
      const aggCounties = ['Box Elder County', 'Cache County', 'Rich County']
      aggCounties.forEach(county => {
        counties.push({
          county,
          aggregatedIn: 'Bear River',
          cases
        })
      })
      return
    }

    counties.push({
      county: geography.addCounty(county),
      cases
    })
  }
}
