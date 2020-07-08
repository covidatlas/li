const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const transform = require('../_lib/transform.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:IE'

const isoMap = { // Non-unique gets mapped straight to ISO2
  'Meath': 'iso2:IE-MH',
}

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  friendly: {
    name: 'Ireland Open Data Portal',
    url: 'https://data.gov.ie/',
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc, maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-02-27',
      crawl: [
        {
          type: 'csv',
          url: 'http://opendata-geohive.hub.arcgis.com/datasets/d9be85b30d7748b5b7c09450b8aede63_0.csv?outSR={"latestWkid":3857,"wkid":102100}'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        // Sample TimeStamp: 2020/02/27 00:00:00+00
        const toYYYYMMDD = (s) => s.split(' ')[0].replace(/\//g, '-')
        const { func, filterDate } = timeseriesFilter($, 'TimeStamp', toYYYYMMDD, date)

        const states = $.filter(func).map(item => {
          return {
            state: getIso2FromName({ country, name: item.CountyName, isoMap }),
            cases: parse.number(item.ConfirmedCovidCases),
            date: filterDate

            // Deaths and recovered are both empty in this and other arcgis data;
            // better to not report than to report bad data.
            // deaths: parse.number(item.ConfirmedCovidDeaths),
            // recovered: parse.number(item.ConfirmedCovidRecovered),
          }
        })

        const emptyCountryRecord = {
          country,
          date: filterDate,
          cases: 0,
          // deaths: 0,
          // recovered: 0
        }
        const summedData = Object.assign(emptyCountryRecord, transform.sumData(states))
        states.push(summedData)

        assert(summedData.cases >= 0, 'Cases are not reasonable for date: ' + date)
        return states
      }
    }
  ]
}
