const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')
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
  maintainers: [ maintainers.qgolsteyn, maintainers.camjc, maintainers.jzohrab ],
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
        [ cases, deaths, hospitalized, tested ].forEach(d => {
          // If the DATE is 'NA', assume it's from before dates were recorded.
          d.forEach(r => {
            if (r.DATE === 'NA')
              r.DATE = '2020-02-28'
          })
        })

        // Per https://en.wikipedia.org/wiki/Provinces_of_Belgium,
        // Belgium is divided into 3 regions, some of which are
        // divided further into provinces.

        // Build full empty list of records for all region/provice
        // pairs, and all regions.
        const dataByRegionThenProvince = cases.
              concat(hospitalized).
              reduce((hsh, item) => {
                const r = item.REGION
                const p = item.PROVINCE
                hsh[r] = hsh[r] || {}
                hsh[r][p] = hsh[r][p] || {}
                return hsh
              }, {})

        const dataByRegion = deaths.
              reduce((hsh, item) => {
                const r = item.REGION
                hsh[r] = hsh[r] || {}
                return hsh
              }, {})

        let nationalData = { tested: 0 }

        for (const item of cases.filter(item => item.DATE <= date)) {
          const p = dataByRegionThenProvince[item.REGION][item.PROVINCE]
          p.cases = parse.number(item.CASES) + (p.cases || 0)
        }

        for (const item of deaths.filter(item => item.DATE <= date)) {
          const r = dataByRegion[item.REGION]
          r.deaths = parse.number(item.DEATHS) + (r.deaths || 0)
        }

        for (const item of hospitalized.filter(item => item.DATE <= date)) {
          const p = dataByRegionThenProvince[item.REGION][item.PROVINCE]
          p.hospitalized_current = parse.number(item.NEW_IN) + (p.hospitalized || 0)
          p.discharged = parse.number(item.NEW_OUT) + (p.discharged || 0)
        }

        for (const item of tested.filter(item => item.DATE <= date)) {
          nationalData.tested += parse.number(item.TESTS_ALL)
        }

        const data = []

        for (const reg of Object.keys(dataByRegionThenProvince)) {
          let regionData = {
            state: getIso2FromName({ country, name: reg, isoMap, nameToCanonical }),
            ...dataByRegion[reg]
          }

          switch (reg) {
          case 'Flanders':
          case 'Wallonia': {
            const provinceData = []
            for (const prov of Object.keys(dataByRegionThenProvince[reg])) {
              provinceData.push({
                state: getIso2FromName({ country, name: reg, isoMap, nameToCanonical }),
                county: getIso2FromName({ country, name: prov, isoMap, nameToCanonical }),
                ...dataByRegionThenProvince[reg][prov]
              })
            }

            regionData = transform.sumData(provinceData, regionData)
            data.push(...provinceData)
            data.push(regionData)
            break
          }
          case 'Brussels': {
            regionData = {
              ...dataByRegionThenProvince[reg][reg],
              ...regionData
            }

            // Brussels is both a region and a province. Add to both
            data.push({
              ...regionData,
              county: getIso2FromName({ country, name: reg, isoMap, nameToCanonical })
            })
            data.push(regionData)
            break
          }
          case 'NA': {
            // Simply add this to the country total
            regionData = {
              ...dataByRegionThenProvince[reg][reg],
              ...regionData
            }
            break
          }
          default:
            // ignore (?)
          }

          nationalData = transform.sumData([ regionData ], nationalData)
        }

        data.push(nationalData)
        return data
      }
    }
  ]
}
