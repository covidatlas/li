// Migrated from coronadatascraper, src/shared/scrapers/jhu-usa.js

const assert = require('assert')
const srcShared = '../'
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')


/** Convert the date to a JHU-format m/d/yy, which they use for their
 * field names. */
function getScrapeDateField (cases, date) {
  // The data has a number of fields, some dates d/m/yy, some not.
  const dates = Object.keys(cases[0]).filter(k => k.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/))

  let scrapeDate = datetime.getYYYYMMDD(date)
  const lastDate = datetime.getYYYYMMDD(new Date(`${dates[ dates.length - 1 ]} 12:00:00`))
  if (scrapeDate > lastDate) {
    const msg = `  🚨 ${scrapeDate} > last sample ${lastDate}. Using last sample`
    console.error(msg)
    scrapeDate = lastDate
  }
  const firstDate = datetime.getYYYYMMDD(new Date(`${dates[ 0 ]} 12:00:00`))
  if (scrapeDate < firstDate) {
    throw new Error(`Timeseries starts later than ${scrapeDate}`)
  }

  const parts = scrapeDate.split('-').map(s => parseInt(s, 10))
  return [ parts[1], parts[2], parts[0] - 2000 ].join('/')
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
      startDate: '2020-03-18',
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
        let regions = []

        const dateMDY = getScrapeDateField(cases, date)

        const skippedNoFips = []
        const stateLocations = {}
        for (let index = 0; index < cases.length; index++) {
          // Get location info
          const caseInfo = cases[index]
          const deathInfo = deaths.find(d => d.UID === caseInfo.UID)
          assert(deathInfo, `Have death UID ${caseInfo.UID}`)

          const fips = caseInfo.FIPS.replace(/\.0$/, '').padStart(5, '0')
          if ([ '00000', '88888', '99999' ].includes(fips)) {
            console.warn('  ⚠️  Skipping incorrect FIPS code %s for %s', fips, caseInfo.Combined_Key)
            continue
          }

          // Only include places we have data for.
          // This is necessary, or Li throws when it tries to update locations.
          const countryLevelIDInfo = fipsCodes[fips]
          if (!countryLevelIDInfo) {
            skippedNoFips.push(`${caseInfo.Combined_Key} at fips ${fips}`)
            continue
          }

          if (caseInfo.Admin2.startsWith('Out of ')) {
            console.warn('  ⚠️  Skipping out of state data for %s', caseInfo.Combined_Key)
            continue
          }

          assert(caseInfo[dateMDY], `Have caseInfo for ${dateMDY}, keys = ${Object.keys(caseInfo)}`)
          const location = {
            cases: parse.number(caseInfo[dateMDY]),
            deaths: parse.number(deathInfo[dateMDY])
          }
          // Puerto Rico, Guam, etc.
          if (caseInfo.code3 !== '840') {
            location.country = `iso1:${caseInfo.iso2}`
            regions.push(location)
          }
          if (caseInfo.Admin2 === 'Unassigned') {
            // const stateCode = geography.usStates[parse.string(caseInfo.Province_State)]
            // const stateClid = `iso2:US-${stateCode}`
            location.state = caseInfo.Province_State
            location.county = UNASSIGNED
            regions.push(location)
            continue
          }

          location.county = `fips:${fips}`
          location.state = caseInfo.Province_State
          stateLocations[location.state] = stateLocations[location.state] || []
          stateLocations[location.state].push(location)
          regions.push(location)
        }
        // Sum the whole country
        regions.push(transform.sumData(regions))
        // Sum individual states
        for (const [ state, locations ] of Object.entries(stateLocations)) {
          regions.push(transform.sumData(locations, { state }))
        }
        // remove unassigned counties once we have summed them up
        regions = regions.filter(r => r.county !== UNASSIGNED)
        if (regions.length === 0) {
          throw new Error(`Timeseries does not contain a sample for ${dateMDY}`)
        }

        if (skippedNoFips.length > 0) {
          console.warn(`⚠️ Skipping ${skippedNoFips.length} locations due to no fips`)
          skippedNoFips.forEach(s => { console.warn(`  ${s}`) })
        }
        return regions
      }
    }
  ]
}
