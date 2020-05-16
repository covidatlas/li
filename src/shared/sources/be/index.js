// const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
const datetime = require('../../datetime/index.js')
const transform = require('../_lib/transform.js')
const { UNASSIGNED } = require('../_lib/constants.js')

const country = 'iso1:BE'

const isoMap = { // Non-unique gets mapped straight to ISO2
  'Flanders': 'iso2:BE-VLG',
}

const nameToCanonical = { // Name differences get mapped to the canonical names
  'Antwerpen': 'Antwerp',
  "OostVlaanderen": "East Flanders",
  "VlaamsBrabant": "Flemish Brabant",
  "WestVlaanderen": "West Flanders",
  "Li�ge": "Liège",
  "BrabantWallon": "Walloon Brabant",
  "NA": UNASSIGNED,
}

module.exports = {
  aggregate: 'state',
  country,
  timeseries: true,
  priority: 1,
  friendly: {
    name: 'Sciensano',
    url: 'https://www.sciensano.be/en'
  },
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          name: 'cases',
          type: 'csv',
          url: 'https://epistat.sciensano.be/Data/COVID19BE_CASES_AGESEX.csv'
        },
        {
          name: 'deaths',
          type: 'csv',
          url: 'https://epistat.sciensano.be/Data/COVID19BE_MORT.csv'
        },
        {
          name: 'hospitalized',
          type: 'csv',
          url: 'https://epistat.sciensano.be/Data/COVID19BE_HOSP.csv'
        },
        {
          name: 'tested',
          type: 'csv',
          url: 'https://epistat.sciensano.be/Data/COVID19BE_tests.csv'
        }
      ],
      scrape ({ cases, deaths, hospitalized, tested }, date, { getIso2FromName }) {
        const dataByRegion = {}
        const dataByProvince = {}
        let nationalData = { tested: 0 }

        for (const item of cases) {
          if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
            if (!dataByProvince[item.REGION]) {
              dataByProvince[item.REGION] = {}
            }
            const regionData = dataByProvince[item.REGION]

            if (!regionData[item.PROVINCE]) {
              regionData[item.PROVINCE] = {}
            }
            const provinceData = regionData[item.PROVINCE]

            provinceData.cases = parse.number(item.CASES) + (provinceData.cases || 0)
          }
        }

        for (const item of deaths) {
          if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
            if (!dataByRegion[item.REGION]) {
              dataByRegion[item.REGION] = {}
            }
            const regionData = dataByRegion[item.REGION]

            regionData.deaths = parse.number(item.DEATHS) + (regionData.deaths || 0)
          }
        }

        for (const item of hospitalized) {
          if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
            if (!dataByProvince[item.REGION]) {
              dataByProvince[item.REGION] = {}
            }
            const regionData = dataByProvince[item.REGION]

            if (!regionData[item.PROVINCE]) {
              regionData[item.REGION] = {}
            }
            const provinceData = regionData[item.PROVINCE]

            provinceData.hospitalized = parse.number(item.NEW_IN) + (provinceData.hospitalized || 0)
            provinceData.discharged = parse.number(item.NEW_OUT) + (provinceData.discharged || 0)
          }
        }

        for (const item of tested) {
          if (item.DATE === 'NA' || datetime.dateIsBeforeOrEqualTo(item.DATE, date)) {
            nationalData.tested += parse.number(item.TESTS)
          }
        }

        const data = []

        for (const reg of Object.keys(dataByProvince)) {
          let regionData = {
            state: getIso2FromName({ country, name: reg, isoMap, nameToCanonical }),
            ...dataByRegion[reg]
          }

          if ([ 'Flanders', 'Wallonia' ].includes(reg)) {
            const provinceData = []
            for (const prov of Object.keys(dataByProvince[reg])) {
              provinceData.push({
                state: getIso2FromName({ country, name: reg, isoMap, nameToCanonical }),
                county: getIso2FromName({ country, name: prov, isoMap, nameToCanonical }),
                ...dataByProvince[reg][prov]
              })
            }

            regionData = transform.sumData(provinceData, regionData)
            data.push(...provinceData)
            data.push(regionData)
          } else if (reg === 'Brussels') {
            regionData = {
              ...dataByProvince[reg][reg],
              ...regionData
            }

            // Brussels is both a region and a province. Add to both
            data.push({
              ...regionData,
              county: getIso2FromName({ country, name: reg, isoMap, nameToCanonical })
            })
            data.push(regionData)
          } else if (reg === 'NA') {
            // Simply add this to the country total
            regionData = {
              ...dataByProvince[reg][reg],
              ...regionData
            }
          }
          nationalData = transform.sumData([ regionData ], nationalData)
        }

        data.push(nationalData)

        return data
      }
    }
  ]
}
