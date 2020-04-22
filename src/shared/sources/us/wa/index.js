const parse = require('../../_lib/parse.js')
const maintainers = require('../../_lib/maintainers.js')
const datetime = require('../../../datetime/index.js')
const geography = require('../../_lib/geography/index.js')
const transform = require('../../_lib/transform.js')

// Set county to this if you only have state data, but this isn't the entire state
const UNASSIGNED = '(unassigned)'

const allCounties = [
  'Kitsap County',
  'Mason County',
  'Skamania County',
  'Wahkiakum County',
  'Columbia County',
  'Garfield County',
  'Stevens County',
  'Thurston County',
  'Walla Walla County',
  'Whatcom County',
  'Whitman County',
  'Yakima County',
  'Adams County',
  'Asotin County',
  'Benton County',
  'Chelan County',
  'Clallam County',
  'Clark County',
  'Cowlitz County',
  'Douglas County',
  'Ferry County',
  'Franklin County',
  'Grant County',
  'Grays Harbor County',
  'Island County',
  'Jefferson County',
  'King County',
  'Kittitas County',
  'Klickitat County',
  'Lewis County',
  'Lincoln County',
  'Okanogan County',
  'Pacific County',
  'Pend Oreille County',
  'Pierce County',
  'San Juan County',
  'Skagit County',
  'Snohomish County',
  'Spokane County'
]

module.exports = {
  country: 'iso1:US',
  state: 'iso2:US-WA',
  // state: 'WA',
  friendly: {
    url: 'https://www.doh.wa.gov/',
    name: 'Washington State Department of Health'
  },
  maintainers: [ maintainers.lazd ],

  aggregate: 'county',

  scrapers: [
    {
      startDate: '2020-03-12',
      crawl: [
        {
          type: 'headless',
          data: 'table',
          url: 'https://www.doh.wa.gov/Emergencies/Coronavirus'
        }
      ],
      scrape ($) {
        let counties = []
        const $th = $('th:contains("(COVID-19) in Washington")')
        const $table = $th.closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const cases = parse.number($tr.find('> *:nth-child(2)').text())
          const deaths = parse.number($tr.find('> *:last-child').text())
          let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()))
          if (county === 'Unassigned County') {
            county = UNASSIGNED
          }
          if (index < 1 || index > $trs.get().length - 2) {
            return
          }
          counties.push({
            county,
            cases,
            deaths
          })
        })
        counties = geography.addEmptyRegions(counties, this._counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'headless',
          data: 'table',
          url: 'https://www.doh.wa.gov/Emergencies/Coronavirus'
        }
      ],
      scrape ($) {
        let counties = []
        const $table = $('caption:contains("Number of Individuals Tested")')
          .first()
          .closest('table')
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const cases = parse.number(parse.string($tr.find('td:nth-child(2)').text()) || 0)
          const deaths = parse.number(parse.string($tr.find('td:last-child').text()) || 0)

          let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()))
          if (county === 'Unassigned County') {
            county = UNASSIGNED
          }
          if (index < 1 || index > $trs.get().length - 2) {
            return
          }
          counties.push({
            county,
            cases,
            deaths
          })
        })
        counties = geography.addEmptyRegions(counties, this._counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-23',
      crawl: [
        {
          type: 'headless',
          data: 'table',
          url: 'https://www.doh.wa.gov/Emergencies/Coronavirus'
        }
      ],
      scrape ($) {
        let counties = []
        const $table = $('caption:contains("Confirmed Cases")')
          .first()
          .closest('table')

        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const cases = parse.number(parse.string($tr.find('td:nth-child(2)').text()) || 0)
          const deaths = parse.number(parse.string($tr.find('td:last-child').text()) || 0)

          let county = geography.addCounty(parse.string($tr.find('> *:first-child').text()))
          if (county === 'Unassigned County') {
            county = UNASSIGNED
          }
          if (county === 'Total County') {
            return
          }
          counties.push({
            county,
            cases,
            deaths
          })
        })
        counties = geography.addEmptyRegions(counties, this._counties, 'county')
        counties.push(transform.sumData(counties))
        return counties
      }
    },
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'json',
          url: 'https://services8.arcgis.com/rGGrs6HCnw87OFOT/arcgis/rest/services/CountyCases/FeatureServer/0/query?f=json&where=(CV_State_Cases%3E0)&returnGeometry=false&outFields=*&orderByFields=CNTY_NAME%20asc'
        }
      ],
      scrape (data, scrapeDate) {
        const counties = []
        data.features.forEach(item => {
          const cases = item.attributes.CV_PositiveCases
          const deaths = item.attributes.CV_Deaths
          const county = geography.addCounty(item.attributes.CNTY_NAME)

          const updated = new Date(item.attributes.CV_Updated)
          if (datetime.dateIsBefore(updated, scrapeDate)) {
            console.error(`⚠️  us-wa: stale data for ${county}\n   Scrape date: ${scrapeDate.toLocaleString()}\n   Last updated: ${updated.toLocaleString()}`)
          }

          counties.push({
            county,
            cases,
            deaths
          })
        })

        const totals = {
          cases: data.features[0].attributes.CV_State_Cases,
          deaths: data.features[0].attributes.CV_State_Deaths
        }
        counties.push(totals)
        return geography.addEmptyRegions(counties, allCounties, 'county')
      }
    }
  ]

}
