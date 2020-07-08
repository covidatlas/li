const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const timeseriesFilter = require('../_lib/timeseries-filter.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:IT'

const isoMap = { // Non-unique gets mapped straight to ISO2
  'Calabria': 'iso2:IT-78',
  'Lombardia': 'iso2:IT-25',
  'P.A. Trento': 'iso2:IT-32',
  'Piemonte': 'iso2:IT-21',
  'Puglia': 'iso2:IT-75',
  'Sicilia': 'iso2:IT-82',
  'Toscana': 'iso2:IT-52',
  "Valle d'Aosta": 'iso2:IT-23',
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'P.A. Bolzano': UNASSIGNED,
}

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  friendly: {
    name: 'Presidenza del Consiglio dei Ministri - Dipartimento della Protezione Civile',
    url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv',
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-24',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-regioni/dpc-covid19-ita-regioni.csv'
        }
      ],
      scrape ($, date, { getIso2FromName }) {
        function toYYYYMMDD (datestring) { return datestring.substr(0, 10) }
        const { func } = timeseriesFilter($, 'data', toYYYYMMDD, date)

        const states = $
          .filter(func)
          .map(row => ({
            state: getIso2FromName({ country, name: row.denominazione_regione, isoMap, nameToCanonical }),
            cases: parse.number(row.totale_casi),
            deaths: parse.number(row.deceduti),
            recovered: parse.number(row.dimessi_guariti),
            tested: parse.number(row.tamponi),
          }))

        const summedData = transform.sumData(states)
        states.push(summedData)

        assert(summedData.cases > 0, 'Cases are not reasonable for date: ' + date)
        return states
      }
    }
  ]
}
