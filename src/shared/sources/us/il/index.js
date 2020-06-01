// Migrated from coronadatascraper, src/shared/scrapers/US/IL/index.js

const srcShared = "../../../"
const datetime = require(srcShared + "datetime/index.js")
const geography = require(srcShared + "sources/_lib/geography/index.js")
const parse = require(srcShared + "sources/_lib/parse.js")
const transform = require(srcShared + "sources/_lib/transform.js")
const constants = require(srcShared + 'sources/_lib/constants.js')

const baseUrl = "http://www.dph.illinois.gov/sites/default/files/COVID19/"

function ignoreCounty (county) {
  return [
    "Illinois County", "Chicago County", "Suburban Cook County", "Cook County", "Out Of State County"
  ].includes(county)
}

module.exports = {
  state: "iso2:US-IL",
  country: "iso1:US",
  priority: 1,
  aggregate: "county",
  friendly: {
    url: "http://www.dph.illinois.gov",
    name: "IDPH",
    description: "Illinois Department of Public Health",
  },
  scrapers: [
    {
      startDate: "2020-03-18",
      crawl: [
        {
          type: "json",
          url: `${baseUrl}COVID19CountyResults.json`,
        },
      ],
      scrape (data) {
        const counties = []
        const cookCounty = {
          county: "Cook County",
          cases: 0,
          deaths: 0,
          tested: 0,
        }
        for (const county of data.characteristics_by_county.values) {
          let countyName = county.County
          if (county.County === "Unassigned") {
            countyName = constants.UNASSIGNED
          } else {
            countyName = geography.addCounty(countyName)
          }
          const output = {
            county: countyName,
            cases: parse.number(county.confirmed_cases),
            deaths: parse.number(county.deaths || 0),
            tested: parse.number(county.total_tested),
          }
          if (!ignoreCounty(countyName)) {
            counties.push(output)
          } else if (
            output.county === "Chicago County" ||
            output.county === "Cook County"
          ) {
            cookCounty.cases += output.cases
            cookCounty.deaths += output.deaths
            cookCounty.tested += output.tested
          }
        }
        counties.push(cookCounty)
        counties.push(transform.sumData(counties))
        return counties
      },
    },
    {
      startDate: "2020-03-23",
      crawl: [
        {
          type: "json",
          url: () => {
            const date = process.env.SCRAPE_DATE || datetime.getYYYYMMDD()
            const datePart = datetime.getYYYYMMDD(date, "")
            return {
              url: `${baseUrl}COVID19CountyResults${datePart}.json`,
            }
          },
        },
      ],
      scrape (data) {
        const counties = []
        const cookCounty = {
          county: "Cook County",
          cases: 0,
          deaths: 0,
          tested: 0,
        }
        for (const county of data.characteristics_by_county.values) {
          let countyName = county.County
          if (county.County === "Unassigned") {
            countyName = constants.UNASSIGNED
          } else {
            countyName = geography.addCounty(countyName)
          }
          const output = {
            county: countyName,
            cases: parse.number(county.confirmed_cases),
            deaths: parse.number(county.deaths || 0),
            tested: parse.number(county.total_tested),
          }
          if (!ignoreCounty(countyName)) {
            counties.push(output)
          } else if (
            output.county === "Chicago County" ||
            output.county === "Cook County"
          ) {
            cookCounty.cases += output.cases
            cookCounty.deaths += output.deaths
            cookCounty.tested += output.tested
          }
        }
        counties.push(cookCounty)
        counties.push(transform.sumData(counties))
        return counties
      },
    },
    {
      startDate: "2020-03-24",
      crawl: [
        {
          type: "json",
          url: "http://www.dph.illinois.gov/sitefiles/COVIDTestResults.json",
        },
      ],
      scrape (data) {
        const counties = []
        const cookCounty = {
          county: "Cook County",
          cases: 0,
          deaths: 0,
          tested: 0,
        }
        for (const county of data.characteristics_by_county.values) {
          let countyName = county.County
          if (county.County === "Unassigned") {
            countyName = constants.UNASSIGNED
          } else {
            countyName = geography.addCounty(countyName)
          }
          const output = {
            county: countyName,
            cases: parse.number(county.confirmed_cases),
            deaths: parse.number(county.deaths || 0),
            tested: parse.number(county.total_tested),
          }
          if (!ignoreCounty(countyName)) {
            counties.push(output)
          } else if (
            output.county === "Chicago County" ||
            output.county === "Cook County"
          ) {
            cookCounty.cases += output.cases
            cookCounty.deaths += output.deaths
            cookCounty.tested += output.tested
          }
        }
        counties.push(cookCounty)
        counties.push(transform.sumData(counties))
        return counties
      },
    },
  ],
}
