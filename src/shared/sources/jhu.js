// Migrated from coronadatascraper, src/shared/scrapers/jhu.js

const srcShared = '../'
const assert = require('assert')
const datetime = require(srcShared + 'datetime/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

/** Convert the date to a JHU-format m/d/yy, which they use for their
 * field names. */
function getScrapeDateField (cases, date) {
  // The data has a number of fields, some dates d/m/yy, some not.
  let scrapeDate = datetime.getYYYYMMDD(date)

  const dates = Object.keys(cases[0]).filter(k => k.match(/^\d{1,2}\/\d{1,2}\/\d{2}$/))
  const firstDate = datetime.getYYYYMMDD(new Date(`${dates[ 0 ]} 12:00:00`))
  const lastDate = datetime.getYYYYMMDD(new Date(`${dates[ dates.length - 1 ]} 12:00:00`))

  if (scrapeDate > lastDate) {
    const msg = `  🚨 ${scrapeDate} > last sample ${lastDate}. Using last sample`
    console.log(msg)
    scrapeDate = lastDate
  }
  if (scrapeDate < firstDate) {
    throw new Error(`Timeseries starts later than ${scrapeDate}`)
  }

  const parts = scrapeDate.split('-').map(s => parseInt(s, 10))
  const ret = [ parts[1], parts[2], parts[0] - 2000 ].join('/')
  return ret
}

/**
 * Data utils.
 */

function _getRecovered (recovered, state, country) {
  for (const location of recovered) {
    if (location['Province/State'] === state && location['Country/Region'] === country) {
      return location
    }
  }
}

function _rollup (locations) {
  // get all countries with states
  const countriesToRoll = new Set(locations.filter(l => l.state).map(l => l.country))
  // calculate sumData for each country
  for (const country of countriesToRoll) {
    const regions = locations.filter(l => l.country === country)
    const countrySum = transform.sumData(regions, { country, aggregate: 'state' })
    locations.push(countrySum)
  }
}

function _createIsoMap (isoMapCsv, iso2Codes) {
  const iso2vals = Object.values(iso2Codes)
  assert(iso2vals.length > 0, 'iso2Codes loaded correctly.')

  const isoMap = {}
  const stateNameByCountry = {}
  for (const data of iso2vals) {
    const { iso2, name } = data
    const countrylevelId = data.countrylevel_id
    const countryCode = iso2.slice(0, 2)
    stateNameByCountry[countryCode] = stateNameByCountry[countryCode] || {}
    stateNameByCountry[countryCode][name] = countrylevelId
  }
  for (const row of isoMapCsv) {
    const country = row.Country_Region
    const state = row.Province_State
    const countryCode = row.iso2
    if (!countryCode) {
      continue
    }
    // using a key like 'Australia#New South Wales'
    const key = `${country}#${state}`
    // US is in other file
    if (country === 'US') {
      continue
    }

    const stateMap = {
      'Hong Kong': 'iso1:HK',
      Macau: 'iso1:MO',
      Greenland: 'iso1:GL'
    }

    if (state in stateMap) {
      isoMap[key] = stateMap[state]
      continue
    }
    if (!state) {
      isoMap[key] = `iso1:${countryCode}`
    } else {
      const stateNames = stateNameByCountry[countryCode]
      if (!stateNames) {
        console.warn(`  ℹ️  createIsoMap 1: ${state} needs to be added to stateMap`)
        continue
      }
      const clId = stateNames[state]
      if (!clId) {
        console.warn(`  ℹ️  createIsoMap 2: ${state} needs to be added added to stateMap`)
      }
      isoMap[key] = clId
    }
  }
  return isoMap
}


/** ID manipulation.
 *
 * (taken from coronadatascraper/src/shared/lib/geography/country-levels.js)
 */

function isId (str) {
  if (Array.isArray(str)) {
    return false
  }
  if (!str) return false
  const [ level, code ] = str.split(':')
  return [ 'iso1', 'iso2', 'fips' ].includes(level) && Boolean(code)
}

function splitId (id) {
  assert(isId(id), `Wrong id: ${id}`)
  const [ level, code ] = id.split(':')
  return { level, code }
}


/** Source. */

module.exports = {
  maintainers: [ maintainers.lazd, maintainers.jzohrab ],
  timeseries: true,
  priority: -1,
  country: 'iso1:US',
  tz: 'America/Los_Angeles',
  curators: [
    {
      name: 'JHU CSSE',
      url: 'https://systems.jhu.edu/research/public-health/ncov/',
    },
  ],
  scrapers: [
    {
      startDate: '2020-01-22',
      crawl: [
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv',
          name: 'cases',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_global.csv',
          name: 'deaths',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_recovered_global.csv',
          name: 'recovered',
        },
        {
          type: 'csv',
          url: 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/UID_ISO_FIPS_LookUp_Table.csv',
          name: 'isomapraw',
        },
      ],
      scrape ( { cases, deaths, recovered, isomapraw }, date, { iso2Codes }) {

        const isoMap = _createIsoMap(isomapraw, iso2Codes)
        const countries = []

        const scrapeDateString = getScrapeDateField(cases, date)

        for (let index = 0; index < cases.length; index++) {
          const caseInfo = cases[index]
          const country = caseInfo['Country/Region']
          const state = caseInfo['Province/State']
          const key = `${country}#${state}`
          const clId = isoMap[key]
          if (!clId) {
            console.warn(`  ⚠️  Skipping ${country} ${state}`)
            continue
          }

          const caseData = {}

          if (caseInfo[scrapeDateString])
            caseData.cases = parse.number(caseInfo[scrapeDateString])

          const deathInfo = deaths.find(d => d.UID === caseInfo.UID)
          if (deathInfo && deathInfo[scrapeDateString])
            caseData.deaths = parse.number(deathInfo[scrapeDateString])

          const recoveredData = _getRecovered(recovered, state, country)
          if (recoveredData && recoveredData[scrapeDateString]) {
            caseData.recovered = parse.number(recoveredData[scrapeDateString])
          }

          const { level, code } = splitId(clId)
          if (level === 'iso1') {
            caseData.aggregate = 'country'
            caseData.country = clId
          } else {
            const countryCode = code.slice(0, 2)
            caseData.aggregate = 'state'
            caseData.state = clId
            caseData.country = `iso1:${countryCode}`
          }
          countries.push(caseData)
        }
        _rollup(countries)
        if (countries.length === 0) {
          throw new Error(`Timeseries does not contain a sample for ${scrapeDateString}`)
        }
        return countries

      }
    }
  ]
}
