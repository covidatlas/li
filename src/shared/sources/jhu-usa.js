// Migrated from coronadatascraper, src/shared/scrapers/jhu-usa.js

const assert = require('assert')
const srcShared = '../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')


/**
 * JHU data is CSV, with the headings containing non-dates, and then
 * dates in m/d/y format
 * (e.g. "...Combined_Key,Population,1/22/20,1/23/20...7/28/20,7/29/20").
 * We need to pull out the data for the current scrape date, supplied
 * as a string to the scrape() function. */

function mdyToYYYYMMDD (s) {
  const [ m, d, y ] = s.split('/').map(n => parseInt(n, 10))
  const ret = new Date(2000 + y, m - 1, d).toISOString().split('T')[0]
  return ret
}

function YYYYMMDDtoMdy (s) {
  const parts = s.split('-').map(s => parseInt(s, 10))
  return [ parts[1], parts[2], parts[0] - 2000 ].join('/')
}


function getScrapeDateYYYYMMDD (cases, date) {
  // The data has a number of fields, some dates d/m/yy, some not.
  const dates = Object.keys(cases[0]).
        filter(k => k.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/)).
        map(mdyToYYYYMMDD).
        sort()

  if (date < dates[0]) {
    throw new Error(`Requested date ${date} < earliest date ${dates[0]}`)
  }

  const lastDate = dates.slice(-1)[0]
  console.log(`lastDate = ${lastDate}`)
  if (date > lastDate) {
    console.log(`Using date = ${lastDate}`)
    return lastDate
  }

  return date
}


module.exports = {
  maintainers: [ maintainers.lazd, maintainers.jzohrab ],
  timeseries: true,
  priority: -1,
  country: 'iso1:US',

  // JHU is in Maryland, so we'll assume that they report all of the
  // data as at their timezone.
  tz: 'America/New_York',
  aggregate: 'county',
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/',
    },
  ],
  scrapers: [
    {
      startDate: '2020-01-23',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv',
          name: 'cases',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv',
          name: 'deaths',
        },
      ],
      scrape ( { cases, deaths }, date, { fipsCodes } ) {

        // First get all locationID parts for each row, starting from the
        // country-levels data and working backwards.
        // Return null if no locationID parts, else return struct.
        function getLocationParts (caseInfo) {

          let state = caseInfo.Province_State
          let county = caseInfo.FIPS.replace(/\.0$/, '').padStart(5, '0')

          if (county === '00000') {
            county = null
          }

          // Disregard invalid county data (invalid, according to our country-levels data).
          const disregardFIPS = [
            'American Samoa',
            'Guam',
            'Northern Mariana Islands',
            'Virgin Islands'
          ]
          if (disregardFIPS.includes(caseInfo.Province_State))
            county = null

          // Unassigned is always at the "county" level.
          if (caseInfo.Admin2 === 'Unassigned') {
            county = UNASSIGNED
          }

          const haveCounty = (county !== null && county !== UNASSIGNED)

          if (haveCounty && !fipsCodes[county]) {
            console.warn(`WARN: Skipping ${caseInfo.Combined_Key} at fips ${county} due to no fips data`)
            return null
          }

          if (haveCounty) {
            county = `fips:${county}`
          }

          if (caseInfo.code3 !== '840') {
            // Guam, Puerto Rico, etc.  In country-levels, they are
            // recorded as countries, and also as states, with
            // optional additional fips data.
            state = `iso2:US-${caseInfo.iso2}`
          }

          return { state, county }
        }

        for (const caseInfo of cases) {
          caseInfo.locationParts = getLocationParts(caseInfo)
        }

        // Filter out bad locations.
        const keepCases = cases.filter(caseInfo => caseInfo.locationParts !== null)
        console.warn(`WARN: of ${cases.length} records, only importing ${keepCases.length}`)

        const scrapeDate = getScrapeDateYYYYMMDD(keepCases, date)
        const dateMDY = YYYYMMDDtoMdy(scrapeDate)

        let regions = []
        const stateLocations = {}
        for (const caseInfo of keepCases) {
          assert(caseInfo[dateMDY], `Have caseInfo for ${dateMDY}, keys = ${Object.keys(caseInfo)}`)
          const deathInfo = deaths.find(d => d.UID === caseInfo.UID)
          assert(deathInfo, `Have death UID ${caseInfo.UID}`)

          const location = {
            cases: parse.number(caseInfo[dateMDY]),
            deaths: parse.number(deathInfo[dateMDY]),
            ...caseInfo.locationParts
          }

          regions.push(location)

          stateLocations[location.state] = stateLocations[location.state] || []
          stateLocations[location.state].push(location)
        }

        // Sum the whole country.
        regions.push(transform.sumData(regions))

        // Sum individual states.  Note that single-entry locations
        // such as Guam will be deduped when written to the db, as the
        // locationID will be the same for both the individual entry
        // and the "summed" entry.
        for (const [ state, locations ] of Object.entries(stateLocations)) {
          regions.push(transform.sumData(locations, { state }))
        }

        // remove unassigned counties once we have summed them up
        regions = regions.filter(r => r.county !== UNASSIGNED)
        if (regions.length === 0) {
          throw new Error(`Timeseries does not contain a sample for ${dateMDY}`)
        }

        return regions.map(r => Object.assign(r, { date: scrapeDate }))
      }
    }
  ]
}
