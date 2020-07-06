// Migrated from coronadatascraper, src/shared/scrapers/US/PA/index.js


const srcShared = '../../../'
const assert = require('assert')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

const _counties = [
  'Adams County',
  'Allegheny County',
  'Armstrong County',
  'Beaver County',
  'Bedford County',
  'Berks County',
  'Blair County',
  'Bradford County',
  'Bucks County',
  'Butler County',
  'Cambria County',
  'Cameron County',
  'Carbon County',
  'Centre County',
  'Chester County',
  'Clarion County',
  'Clearfield County',
  'Clinton County',
  'Columbia County',
  'Crawford County',
  'Cumberland County',
  'Dauphin County',
  'Delaware County',
  'Elk County',
  'Erie County',
  'Fayette County',
  'Forest County',
  'Franklin County',
  'Fulton County',
  'Greene County',
  'Huntingdon County',
  'Indiana County',
  'Jefferson County',
  'Juniata County',
  'Lackawanna County',
  'Lancaster County',
  'Lawrence County',
  'Lebanon County',
  'Lehigh County',
  'Luzerne County',
  'Lycoming County',
  'McKean County',
  'Mercer County',
  'Mifflin County',
  'Monroe County',
  'Montgomery County',
  'Montour County',
  'Northampton County',
  'Northumberland County',
  'Perry County',
  'Philadelphia County',
  'Pike County',
  'Potter County',
  'Schuylkill County',
  'Snyder County',
  'Somerset County',
  'Sullivan County',
  'Susquehanna County',
  'Tioga County',
  'Union County',
  'Venango County',
  'Warren County',
  'Washington County',
  'Wayne County',
  'Westmoreland County',
  'Wyoming County',
  'York County',
]


module.exports = {
  state: 'iso2:US-PA',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://www.health.pa.gov/',
    name: 'Pennsylvania Department of Health',
  },
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'list',
          url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
        },
      ],
      scrape ($) {
        let counties = []
        const $lis = $('li:contains("Counties impacted to date include")')
              .nextAll('ul')
              .first()
              .find('li')
        $lis.each((index, li) => {
          const matches = $(li)
                .text()
                .match(/([A-Za-z]+) \((\d+\))/)
          if (matches) {
            const county = geography.addCounty(parse.string(matches[1]))
            const cases = parse.number(matches[2])
            counties.push({
              county,
              cases
            })
          }
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-16',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
        },
      ],
      scrape ($) {
        const $table = $('table.ms-rteTable-default').first()
        const $trs = $table.find('tbody > tr')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const data = {
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          }
          counties.push(data)
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-17',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.pa.gov/topics/disease/Pages/Coronavirus.aspx',
        },
      ],
      scrape ($) {
        const $table = $('table.ms-rteTable-default').eq(1)
        const $trs = $table.find('tbody > tr')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const data = {
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:last-child').text())
          }
          counties.push(data)
        })
        counties.push(transform.sumData(counties))
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
        },
      ],
      scrape ($) {
        const $countyTable = $('th:contains("County")').closest('table')
        const $trs = $countyTable.find('tbody > tr:not(:first-child)')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:nth-child(2)').text()),
            deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
          })
        })
        const $stateTable = $('table.ms-rteTable-default').eq(0)
        const stateData = transform.sumData(counties)
        stateData.tested =
          parse.number($stateTable.find('tr:last-child td:first-child').text()) +
          parse.number($stateTable.find('tr:last-child td:nth-child(2)').text())
        counties.push(stateData)
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-03-26',
      crawl: [
        {
          type: 'page',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
          data: 'table'
        },
      ],
      scrape ($) {
        const $countyTable = $('td:contains("County")').closest('table')
        const $trs = $countyTable.find('tbody > tr:not(:first-child)')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:nth-child(2)').text()),
            deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
          })
        })
        const $stateTable = $('table.ms-rteTable-default').eq(0)
        const stateData = transform.sumData(counties)
        stateData.tested =
          parse.number($stateTable.find('tr:last-child td:first-child').text()) +
          parse.number($stateTable.find('tr:last-child td:nth-child(2)').text())
        counties.push(stateData)
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-04-15',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
        },
      ],
      scrape ($) {
        const $countyTable = $('td:contains("County")')
              .closest('table')
              .first()
        const $trs = $countyTable.find('tbody > tr:not(:first-child)')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:nth-child(2)').text()),
            deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
          })
        })
        const $stateTable = $('table.ms-rteTable-default').eq(0)
        const stateData = transform.sumData(counties)
        stateData.tested =
          parse.number($stateTable.find('tr:last-child td:first-child').text()) +
          parse.number($stateTable.find('tr:last-child td:nth-child(2)').text())
        counties.push(stateData)
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-04-16',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
        },
      ],
      scrape ($) {
        const $countyTable = $('td:contains("County")')
              .closest('table')
              .first()
        const $trs = $countyTable.find('tbody > tr:not(:first-child)')
        let counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          counties.push({
            county: geography.addCounty(parse.string($tr.find('td:first-child').text())),
            cases: parse.number($tr.find('td:nth-child(2)').text()),
            tested: parse.number($tr.find('td:nth-child(2)').text()) + parse.number($tr.find('td:nth-child(3)').text()),
            deaths: parse.number(parse.string($tr.find('td:last-child').text()) || 0)
          })
        })
        const $stateTable = $('table.ms-rteTable-default').eq(0)
        const stateData = transform.sumData(counties)
        stateData.tested =
          parse.number($stateTable.find('tr:last-child td:first-child').text()) +
          parse.number($stateTable.find('tr:last-child td:nth-child(2)').text())
        counties.push(stateData)
        counties = geography.addEmptyRegions(counties, _counties, 'county')
        return counties
      }
    },
    {
      startDate: '2020-05-18',
      crawl: [
        {
          type: 'page',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
          name: 'cases',
          data: 'table'
        },
        {
          type: 'page',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Death-Data.aspx',
          name: 'deaths',
          data: 'table'
        },
      ],
      scrape ({ cases, deaths }) {
        // Data is split across two pages.
        const allCounties = {}
        // Cases and tested
        let $ = cases
        const $countyCases = $('td:contains("County")')
              .closest('table')
              .first()
        let $headings = $countyCases
            .find('tbody > tr')
            .eq(0)
            .find('td')
        let hs = $headings.toArray().map(el => $(el).text())
        assert.equal('County,Total Cases,Negatives', hs.join(), 'headings')
        let $trs = $countyCases.find('tbody > tr:not(:first-child)')
        $trs.each((index, tr) => {
          const tds = $(tr)
                .find('td')
                .toArray()
                .map(el => $(el).text())
          allCounties[parse.string(tds[0])] = {
            cases: parse.number(tds[1]),
            tested: parse.number(tds[1]) + parse.number(tds[2])
          }
        })

        // Deaths.
        $ = deaths
        const $countyDeaths = $('td:contains("County")')
              .closest('table')
              .first()
        $headings = $countyDeaths
          .find('tbody > tr')
          .eq(0)
          .find('td')
        hs = $headings
          .toArray()
          .slice(0, 2)
          .map(el =>
               $(el)
               .text()
               .trim()
              )
        assert.equal('County,# of Deaths', hs.join(), 'headings')
        $trs = $countyDeaths.find('tbody > tr:not(:first-child)')
        $trs.each((index, tr) => {
          const tds = $(tr)
                .find('td')
                .toArray()
                .slice(0, 2)
                .map(el => $(el).text())
          const k = parse.string(tds[0])
          allCounties[k] = { ...allCounties[k], deaths: parse.number(tds[1]) }
        })
        // Create records.
        const counties = []
        Object.keys(allCounties).forEach(k => {
          const county = geography.addCounty(k)
          counties.push({ county, ...allCounties[k] })
        })
        const result = geography.addEmptyRegions(counties, _counties, 'county')
        // Add state level.
        const stateData = transform.sumData(counties)
        result.push(stateData)
        // console.table(result)
        return result

      }
    },
    {
      startDate: '2020-06-10',
      crawl: [
        {
          type: 'page',
          url: 'https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx',
          name: 'cases',
          data: 'table'
        }
      ],
      scrape ($) {
        const allCounties = {}
        // Cases and tested
        const $countyCases = $('td:contains("County")')
              .closest('table')
              .first()
        let $headings = $countyCases
            .find('tbody > tr')
            .eq(0)
            .find('td')
        let hs = $headings.toArray().map(el => $(el).text())
        assert.equal('County,Total Cases,Negatives', hs.join(), 'headings')
        let $trs = $countyCases.find('tbody > tr:not(:first-child)')
        $trs.each((index, tr) => {
          const tds = $(tr)
                .find('td')
                .toArray()
                .map(el => $(el).text())
          allCounties[parse.string(tds[0])] = {
            cases: parse.number(tds[1]),
            tested: parse.number(tds[1]) + parse.number(tds[2])
          }
        })

        // Create records.
        const counties = []
        Object.keys(allCounties).forEach(k => {
          const county = geography.addCounty(k)
          counties.push({ county, ...allCounties[k] })
        })
        const result = geography.addEmptyRegions(counties, _counties, 'county')
        // Add state level.
        const stateData = transform.sumData(counties)
        result.push(stateData)
        // console.table(result)
        return result

      }
    }

    // TODO (scrapers) us-pa stopped working 2020-06-08
    // ref https://github.com/covidatlas/coronadatascraper/issues/1055
    // Now data is present in PDFs at links on
    // https://www.health.pa.gov/topics/disease/coronavirus/Pages/Cases.aspx
  ]
}
