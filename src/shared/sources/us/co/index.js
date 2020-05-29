// Migrated from coronadatascraper, src/shared/scrapers/US/CO/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const assert = require('assert')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')

module.exports = {
  state: 'iso2:US-CO',
  country: 'iso1:US',
  aggregate: 'county',
  priority: 1,
  maintainers: [ maintainers.jzohrab ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          data: 'list',
          url: 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub',
        },
      ],
      scrape ($) {
        const counties = []
        const $lis = $('p:contains("Positive cases by county of residence")')
              .nextAll('ul')
              .first()
              .find('li')
        $lis.each((index, li) => {
          const matches = $(li)
                .text()
                .match(/(.*?): (\d+)/)
          if (matches) {
            let county = geography.addCounty(parse.string(matches[1]))
            if (county === 'Unknown county County') {
              county = UNASSIGNED
            }
            const data = {
              county,
              cases: parse.number(matches[2])
            }
            counties.push(data)
          }
        })
        const visitorCounties = []
        const $visitors = $('p:contains("Positive cases by county of residence")')
              .nextAll('p')
              .find('span')
        $visitors.each((index, visitor) => {
          const visitorInfo = $(visitor)
                .text()
                .match(/([A-Za-z]+) - (\d+)/)
          if (visitorInfo !== null && visitorInfo.length === 3) {
            const county = `${visitorInfo[1]} County`
            const cases = visitorInfo[2]
            if (!county.includes('information')) {
              const data = {
                county: geography.addCounty(parse.string(county)),
                cases: parse.number(cases)
              }
              // TODO (scrapers) CDS had this rule check conditional
              // before the .push(), I don't know if it's necessary.
              // if (rules.isAcceptable(data, null, this._reject))
              visitorCounties.push(data)
            }
          }
        })
        counties.forEach(county => {
          if (county.cases !== undefined && county.county !== undefined) {
            visitorCounties.forEach(visitorCounty => {
              if (visitorCounty.cases !== undefined && visitorCounty.county !== undefined) {
                if (visitorCounty.county === county.county) {
                  county.cases = visitorCounty.cases + county.cases
                }
              }
            })
          }
        })
        counties.push(transform.sumData(counties))
        return counties

      }
    },
    {
      startDate: '2020-03-15',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://docs.google.com/document/d/e/2PACX-1vRSxDeeJEaDxir0cCd9Sfji8ZPKzNaCPZnvRCbG63Oa1ztz4B4r7xG_wsoC9ucd_ei3--Pz7UD50yQD/pub',
        },
      ],
      scrape ($) {
        return {
          cases: parse.number(
            $('span:contains("Positive")')
              .text()
              .split(':')[1]
          ),
          tested: parse.number(
            $('span:contains("Total number of people tested")')
              .text()
              .split(':')[1]
          )
        }
      }
    },
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/46c727cc29424b1fb9db67554c7df04e_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.FULL_),
            cases: parse.number(county.Number_of_COVID_positive_cases_)
          })
        }
        const stateData = transform.sumData(counties)
        counties.push(stateData)
        return counties
      }
    },
    {
      startDate: '2020-03-19',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/dec84f18254341419c514af8f9e784ba_0.csv',
        },
      ],
      scrape (data) {
        this.type = 'csv'
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.FULL_),
            cases: parse.number(county.Number_of_COVID_positive_cases_)
          })
        }
        const stateData = transform.sumData(counties)
        counties.push(stateData)
        return counties
      }
    },
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/fbae539746324ca69ff34f086286845b_0.csv',
        },
      ],
      scrape (data) {
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.FULL_),
            cases: parse.number(county.County_Pos_Cases)
          })
        }
        const stateData = transform.sumData(counties)
        stateData.deaths = parse.number(data[0].State_Deaths)
        counties.push(stateData)
        return counties
      }
    },
    {
      startDate: '2020-04-23',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/fbae539746324ca69ff34f086286845b_0.csv',
        },
      ],
      scrape (data) {
        assert(data, `Have csv`)
        const requiredKeys = [
          'FULL_',
          'County_Pos_Cases',
          'County_Population',
          'State_Number_Hospitalizations',
          'State_Deaths',
          'State_Number_Tested'
        ]
        const actualKeys = Object.keys(data[0])
        const missing = requiredKeys.filter(k => !actualKeys.includes(k))
        const msg = `Missing required key(s): ${missing.join(', ')}`
        assert.equal(missing.length, 0, msg)
        console.log(`Pre-filter, data.length: ${data.length}`)
        data = data.filter(d => {
          return d.FULL_ !== ''
        })
        console.log(`Post-filter, data.length: ${data.length}`)
        const counties = []
        for (const county of data) {
          counties.push({
            county: parse.string(county.FULL_),
            cases: parse.number(county.County_Pos_Cases),
            population: parse.number(county.County_Population)
          })
        }
        const stateData = transform.sumData(counties)
        stateData.deaths = parse.number(data[0].State_Deaths)
        stateData.tested = parse.number(data[0].State_Number_Tested)
        counties.push(stateData)
        return counties
      }
    },
    {
      startDate: '2020-05-01',
      crawl: [
        {
          type: 'csv',
          url: 'https://opendata.arcgis.com/datasets/7dd9bfa5607f4c70b2a7c9634ccdca53_0.csv',
        },
      ],
      scrape (data) {
        // The page https://covid19.colorado.gov/covid-19-data has
        // tables of HTML data, but
        // https://covid19.colorado.gov/data/case-data has links to data
        // files in Google docs, and a link with "Find Colorado COVID-19
        // Data on CDPHE's Open Data Portal", which goes to
        // https://data-cdphe.opendata.arcgis.com/datasets/
        // colorado-covid-19-positive-cases-and-rates-of-infection-by-county-of-identification.
        const requiredKeys = [
          'FULL_',
          'County_Pos_Cases',
          'County_Population',
          'County_Deaths',
          'State_Number_Hospitalizations',
          'State_Number_Tested'
        ]
        const actualKeys = Object.keys(data[0])
        const missing = requiredKeys.filter(k => !actualKeys.includes(k))
        const msg = `Missing required key(s): ${missing.join(', ')}`
        assert.equal(missing.length, 0, msg)
        const counties = []
        const filteredData = data.filter(d => {
          return ![ 'OUT OF STATE', 'UNKNOWN', '' ].includes(d.FULL_)
        })
        for (const county of filteredData) {
          counties.push({
            county: parse.string(county.FULL_),
            cases: parse.number(county.County_Pos_Cases || '0'),
            deaths: parse.number(county.County_Deaths || '0'),
            population: parse.number(county.County_Population || '0')
          })
        }
        const stateData = transform.sumData(counties)
        stateData.hospitalized = parse.number(data[0].State_Number_Hospitalizations || '0')
        stateData.tested = parse.number(data[0].State_Number_Tested || '0')
        counties.push(stateData)
        return counties
      }
    }
  ]
}
