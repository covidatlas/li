const assert = require("assert")
const geography = require("../../../sources/_lib/geography/index.js")
const maintainers = require("../../../sources/_lib/maintainers.js")
const parse = require("../../../sources/_lib/parse.js")
const transform = require("../../../sources/_lib/transform.js")

const _counties = [
  "Adair County",
  "Alfalfa County",
  "Atoka County",
  "Beaver County",
  "Beckham County",
  "Blaine County",
  "Bryan County",
  "Caddo County",
  "Canadian County",
  "Carter County",
  "Cherokee County",
  "Choctaw County",
  "Cimarron County",
  "Cleveland County",
  "Coal County",
  "Comanche County",
  "Cotton County",
  "Craig County",
  "Creek County",
  "Custer County",
  "Delaware County",
  "Dewey County",
  "Ellis County",
  "Garfield County",
  "Garvin County",
  "Grady County",
  "Grant County",
  "Greer County",
  "Harmon County",
  "Harper County",
  "Haskell County",
  "Hughes County",
  "Jackson County",
  "Jefferson County",
  "Johnston County",
  "Kay County",
  "Kingfisher County",
  "Kiowa County",
  "Latimer County",
  "Le Flore County",
  "Lincoln County",
  "Logan County",
  "Love County",
  "Major County",
  "Marshall County",
  "Mayes County",
  "McClain County",
  "McCurtain County",
  "McIntosh County",
  "Murray County",
  "Muskogee County",
  "Noble County",
  "Nowata County",
  "Okfuskee County",
  "Oklahoma County",
  "Okmulgee County",
  "Osage County",
  "Ottawa County",
  "Pawnee County",
  "Payne County",
  "Pittsburg County",
  "Pontotoc County",
  "Pottawatomie County",
  "Pushmataha County",
  "Roger Mills County",
  "Rogers County",
  "Seminole County",
  "Sequoyah County",
  "Stephens County",
  "Texas County",
  "Tillman County",
  "Tulsa County",
  "Wagoner County",
  "Washington County",
  "Washita County",
  "Woods County",
  "Woodward County",
]
const _titleCase = (s) =>
  s
    .toLowerCase()
    .split(" ")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ")

module.exports = {
  aggregate: "county",
  country: "iso1:US",
  maintainers: [ maintainers.paulboal, maintainers.camjc ],
  priority: 1,
  state: "iso2:US-OK",
  friendly: {
    name: "Oklahoma State Department of Health",
  },
  scrapers: [
    {
      startDate: "2020-03-21",
      crawl: [
        {
          data: "table",
          type: "page",
          url: "https://coronavirus.health.ok.gov/",
        },
      ],
      scrape ($) {
        let counties = []
        const $table = $("table[summary='COVID-19 Cases by County']").first()
        const $trs = $table.find("tbody").find("tr")
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const countyName = parse.string($tr.find("td:nth-child(1)").text())
          const countyObj = {
            county: geography.addCounty(parse.string(countyName)),
            cases: parse.number($tr.find("td:nth-child(2)").text() || 0),
            deaths: parse.number($tr.find("td:nth-child(3)").text() || 0),
          }
          if (countyObj.county !== "Total County") {
            counties.push(countyObj)
          }
        })
        counties = geography.addEmptyRegions(counties, _counties, "county")
        counties.push(transform.sumData(counties))
        return counties
      },
    },
    {
      startDate: "2020-04-30",
      crawl: [
        {
          type: "csv",
          url:
            "https://storage.googleapis.com/ok-covid-gcs-public-download/oklahoma_cases_county.csv",
        },
      ],
      scrape (data) {
        let counties = []
        data.forEach((item) => {
          const county = `${_titleCase(item.County)} County`
          const cases = parse.number(item.Cases)
          const deaths = parse.number(item.Deaths)
          const recovered = parse.number(item.Recovered)
          const countyObj = { county, cases, deaths, recovered }
          if (countyObj.county === "Total County") {
            console.log.warn(`rejecting ${countyObj}`)
          } else {
            counties.push(countyObj)
          }
        })
        counties = geography.addEmptyRegions(counties, _counties, "county")
        const summedData = transform.sumData(counties)
        assert(summedData.cases > 0, "Cases are not reasonable")
        counties.push(summedData)
        return counties
      },
    },
  ],
}
