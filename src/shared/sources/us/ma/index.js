// Migrated from coronadatascraper, src/shared/scrapers/US/MA/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')

const _counties = [
  'Barnstable County',
  'Berkshire County',
  'Bristol County',
  'Essex County',
  'Franklin County',
  'Hampden County',
  'Hampshire County',
  'Middlesex County',
  'Norfolk County',
  'Plymouth County',
  'Suffolk County',
  'Worcester County',
]

module.exports = {
  state: 'iso2:US-MA',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.qgolsteyn, maintainers.aed3, maintainers.jzohrab ],
  friendly:   {
    url: 'https://www.mass.gov/orgs/department-of-public-health',
    name: 'Massachusetts DPH',
    description: 'Massachusetts Department of Public Health',
  },
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'pdf',
          url: () => {
            const dt = new Date().getUTCDate()
            const pg = `covid-19-cases-in-massachusetts-as-of-march-${dt}-2020`
            return `https://www.mass.gov/doc/${pg}/download`
          }
        }
      ],
      scrape (body, date, { pdfUtils }) {
        if (body === null) {
          throw new Error(`No data for ${date}`)
        }
        const rows = pdfUtils.asRows(body).map(row => row.map(col => col.text))
        const counties = []
        const startIndex = rows.findIndex(cols => cols[0] && cols[0].includes('County')) + 1
        for (let i = startIndex; !rows[i][0].includes('Sex'); i++) {
          const data = rows[i]
          const countyName = data[0]
          const cases = data[1]
          const countyObj = {
            county: geography.addCounty(countyName),
            cases: parse.number(cases)
          }
          if (countyName === 'Dukes and') {
            countyObj.county = geography.addCounty(`Dukes and ${data[1]}`)
            countyObj.cases = parse.number(data[2])
          }
          if (
            countyName === 'Dukes and' ||
              (countyName.toLowerCase().includes('nantucket') && countyName.toLowerCase().includes('dukes'))
          ) {
            countyObj.county = [ 'Dukes County', 'Nantucket County' ]
          }
          if (countyName === 'Unknown') {
            countyObj.county = UNASSIGNED
          }
          // Sometimes, numbers end up in two objects
          if (data.length > 2) {
            // Find all number parts
            let caseString = ''
            for (const part of data.slice(1)) {
              if (Number.isNaN(parseInt(part, 10))) {
                break
              }
              caseString += part
            }
            countyObj.cases = parse.number(caseString)
          }
          counties.push(countyObj)
        }
        const summedData = transform.sumData(counties)
        // MA provides an unknown category, we sum it into the state total
        const unknownIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Unknown'))
        if (unknownIndex > 0) summedData.cases += parse.number(rows[unknownIndex][1])
        // MA has death as a total for the state
        const deathIndex = rows.findIndex(cols => cols[0] && cols[0].includes('Death')) + 1
        if (deathIndex > 0) {
          const deathData = rows[deathIndex]
          summedData.deaths = parse.number(deathData[deathData.length - 1])
        }
        counties.push(summedData)
        return geography.addEmptyRegions(counties, _counties, 'county')

      }
    },
    {
      startDate: '2020-03-30',
      crawl: [
        {
          type: 'json',
          url: 'https://services1.arcgis.com/TXaY625xGc0yvAuQ/arcgis/rest/services/COVID_CASES_MA/FeatureServer/0/query?f=json&where=1%3D1&returnGeometry=false&outFields=*',
        },
      ],
      scrape (data) {
        const counties = []
        let onlySumDeaths = true
        let onlySumTested = true
        let sumDeaths = 0
        let sumTested = 0
        data.features.forEach(item => {
          const countyLC = item.attributes.County.toLowerCase()
          if (item.attributes.County && countyLC.includes('total')) {
            sumDeaths = item.attributes.DEATHS
            sumTested = item.attributes.TESTED
            return
          }
          const cases = item.attributes.CASES || 0
          const deaths = item.attributes.DEATHS || 0
          const tested = item.attributes.TESTED || 0
          const county = geography.addCounty(item.attributes.County.charAt(0) + countyLC.slice(1))
          const countyObj = {
            county,
            cases,
            deaths,
            tested
          }

          // The data has a record where County = "DUKES/NANTUCKET",
          // and also has a record where County = "NANTUCKET."  Since
          // our data model doesn't really support combining
          // locations, I'm arbitrarily assigning this to Dukes, b/c
          // we have a specific record for Nantucket.
          if (countyLC.includes('nantucket') && countyLC.includes('dukes')) {
            countyObj.county = 'Dukes County'
          }
          if (county.includes('Unknown')) {
            countyObj.county = UNASSIGNED
          }
          onlySumDeaths = onlySumDeaths && !item.attributes.DEATHS
          onlySumTested = onlySumTested && !item.attributes.TESTED
          counties.push(countyObj)
        })
        const summedData = transform.sumData(counties)
        if (onlySumDeaths) {
          summedData.deaths = sumDeaths
        }
        if (onlySumTested) {
          summedData.tested = sumTested
        }
        counties.push(summedData)

        return geography.addEmptyRegions(counties, _counties, 'county')

      }
    }
  ]
}
