const assert = require('assert')
const assertTotalsAreReasonable = require('../../utils/assert-totals-are-reasonable.js')
const getKey = require('../../utils/get-key.js')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const transform = require('../_lib/transform.js')

const country = 'iso1:IN'
const countryLevelMap = {
  'Andaman and Nicobar Islands': 'iso2:IN-AN',
  'Andhra Pradesh': 'iso2:IN-AP',
  'Arunachal Pradesh': 'iso2:IN-AR',
  Assam: 'iso2:IN-AS',
  Bihar: 'iso2:IN-BR',
  Chandigarh: 'iso2:IN-CH',
  Chhattisgarh: 'iso2:IN-CT',
  'Dadra and Nagar Haveli': 'iso2:IN-DN',
  'Daman and Diu': 'iso2:IN-DD',
  Delhi: 'iso2:IN-DL',
  Goa: 'iso2:IN-GA',
  Gujarat: 'iso2:IN-GJ',
  Haryana: 'iso2:IN-HR',
  'Himachal Pradesh': 'iso2:IN-HP',
  'Jammu and Kashmir': 'iso2:IN-JK',
  Jharkhand: 'iso2:IN-JH',
  Karnataka: 'iso2:IN-KA',
  Kerala: 'iso2:IN-KL',
  Ladakh: 'iso2:IN-LA',
  Lakshadweep: 'iso2:IN-LD',
  'Madhya Pradesh': 'iso2:IN-MP',
  Maharashtra: 'iso2:IN-MH',
  Manipur: 'iso2:IN-MN',
  Meghalaya: 'iso2:IN-ML',
  Mizoram: 'iso2:IN-MZ',
  Nagaland: 'iso2:IN-NL',
  Odisha: 'iso2:IN-OR',
  Puducherry: 'iso2:IN-PY',
  Punjab: 'iso2:IN-PB',
  Rajasthan: 'iso2:IN-RJ',
  Sikkim: 'iso2:IN-SK',
  'Tamil Nadu': 'iso2:IN-TN',
  Telengana: 'iso2:IN-TG', // The site is using this spelling
  Telangana: 'iso2:IN-TG', // country-levels-export uses this spelling
  Tripura: 'iso2:IN-TR',
  'Uttar Pradesh': 'iso2:IN-UP',
  Uttarakhand: 'iso2:IN-UT',
  'West Bengal': 'iso2:IN-WB'
}

/**
 * @param {string} name - Name of the state.
 * @returns {string} - an iso2 ID.
 */
const getIso2FromName = (name) => countryLevelMap[name]

const labelFragmentsByKey = [
  { state: 'name of state' },
  { deaths: 'death' },
  { cases: 'total confirmed cases' },
  { recovered: 'cured' },
  { discard: 's. no.' }
]

module.exports = {
  aggregate: 'state',
  country,
  friendly: {
    name: 'Ministry of Health and Family Welfare, Government of India',
    url: 'https://www.mohfw.gov.in/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-02-23',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url:
            'https://www.mohfw.gov.in/'
        }
      ],
      scrape ($) {
        const $table = $('#state-data')

        const $headings = $table.find('thead tr th')
        const dataKeysByColumnIndex = []
        $headings.each((index, heading) => {
          const $heading = $(heading)
          dataKeysByColumnIndex[index] = getKey({ label: $heading.text(), labelFragmentsByKey })
        })

        const $trs = $table.find(`tbody > tr`)
        const statesCount = 35
        assert.equal($trs.length, statesCount, 'Wrong number of TRs found')

        const states = []
        $trs.filter(
          // Remove summary rows
          (_rowIndex, tr) =>
            !$(tr)
              .find('td')
              .first()
              .attr('colspan')
        ).each((rowIndex, tr) => {
          const $tds = $(tr).find('td')
          assert.equal($tds.length, dataKeysByColumnIndex.length, 'A row is missing column/s')

          const stateData = {}
          $tds.each((columnIndex, td) => {
            const key = dataKeysByColumnIndex[columnIndex]
            const value = $(td).text()
            stateData[key] = value
          })

          states.push({
            state: getIso2FromName(parse.string(stateData.state.replace(/#/, ''))),
            cases: parse.number(stateData.cases)
          })
        })

        const summedData = transform.sumData(states)
        states.push(summedData)

        const accountForTotalRowColSpan = -1
        const nthChildForCases = 1 + dataKeysByColumnIndex.findIndex(key => key === 'cases') + accountForTotalRowColSpan
        const casesFromTotalRow = parse.number(
          $table.find(`tbody > tr:contains("Total") > td:nth-child(${nthChildForCases})`).text()
        )
        assertTotalsAreReasonable({ computed: summedData.cases, scraped: casesFromTotalRow })
        return states
      }
    }
  ]
}
