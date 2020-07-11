const assert = require('assert')
const datetime = require('../../../datetime/index.js')
const geography = require('../../../sources/_lib/geography/index.js')
const maintainers = require('../../../sources/_lib/maintainers.js')
const parse = require('../../../sources/_lib/parse.js')
const transform = require('../../../sources/_lib/transform.js')
const { UNASSIGNED } = require('../../../sources/_lib/constants.js')

const _counties = [
  'Androscoggin County',
  'Aroostook County',
  'Cumberland County',
  'Franklin County',
  'Hancock County',
  'Kennebec County',
  'Knox County',
  'Lincoln County',
  'Oxford County',
  'Penobscot County',
  'Piscataquis County',
  'Sagadahoc County',
  'Somerset County',
  'Waldo County',
  'Washington County',
  'York County',
]

module.exports = {
  state: 'iso2:US-ME',
  country: 'iso1:US',
  aggregate: 'county',
  friendly: {
    url: 'https://www.maine.gov/dhhs/mecdc',
    name: 'MeCDC',
    description: 'Maine Center for Disease Control & Prevention',
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-22',
      crawl: [
        {
          data: 'table',
          type: 'page',
          url: 'https://www.maine.gov/dhhs/mecdc/infectious-disease/epi/airborne/coronavirus.shtml',
        },
      ],
      scrape ($, date) {
      let counties = []
      // NOTE: Could use some of the helpers to make this more resilient.
      const $th = $('th:contains("Case Counts by County")')
      const $table = $th.closest('table')
      const $trs = $table.find('tbody > tr')
      $trs.each((index, tr) => {
        if (index < 1) {
          return
        }
        const $tr = $(tr)
        let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()))
        const cases = parse.number($tr.find('> *:nth-child(2)').text())
        const recovered = parse.number(parse.string($tr.find('> *:nth-child(3)').text()))
        let deaths
        if (datetime.dateIsBefore(date, '2020-03-30')) {
          deaths = parse.number(parse.string($tr.find('> *:nth-child(4)').text()))
        } else {
          deaths = parse.number(parse.string($tr.find('> *:nth-child(5)').text()))
        }
        if (county === 'Unknown County') {
          county = UNASSIGNED
        }
        counties.push({
          county,
          cases,
          recovered,
          deaths
        })
      })

      counties = geography.addEmptyRegions(counties, _counties, 'county')
      const summedData = transform.sumData(counties)
      counties.push(summedData)
      assert(summedData.cases > 0, 'Cases are not reasonable')
      return counties
      }
    },
    {
      startDate: '2020-07-10',
      crawl: [
        {
          type: 'csv',
          url: 'https://docs.google.com/spreadsheets/d/13Rbm5zKKLTFNyLZ2Z9YYHc5v6YpO_erMz1pZwiUtfiQ/gviz/tq?tqx=out:csv&sheet=cases_by_county'
        },
      ],
      scrape (data) {
        const counties = data.map(d => {
          let county = geography.addCounty(d.PATIENT_COUNTY)
          if (county === 'Unknown County')
            county = UNASSIGNED
          return {
            county,
            cases: parse.number(d.CASES),
            deaths: parse.number(d.DEATHS),
            recovered: parse.number(d.RECOVERIES),
            hospitalized: parse.number(d.HOSPITALIZATIONS),
            date: d.DATA_AS_OF_DT
          }
        })

        const summedData = transform.sumData(counties)
        counties.push({ ...summedData, date: counties[0].date })
        assert(summedData.cases > 0, 'Cases are not reasonable')
        return counties
      }
    }
  ]
}
