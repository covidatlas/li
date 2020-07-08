// Migrated from coronadatascraper, src/shared/scrapers/US/NY/index.js

const srcShared = '../../../'
const datetime = require(srcShared + 'datetime/index.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


const _counties = [
  'Albany County',
  'Allegany County',
  'Bronx County',
  'Broome County',
  'Cattaraugus County',
  'Cayuga County',
  'Chautauqua County',
  'Chemung County',
  'Chenango County',
  'Clinton County',
  'Columbia County',
  'Cortland County',
  'Delaware County',
  'Dutchess County',
  'Erie County',
  'Essex County',
  'Franklin County',
  'Fulton County',
  'Genesee County',
  'Greene County',
  'Hamilton County',
  'Herkimer County',
  'Jefferson County',
  'Kings County',
  'Lewis County',
  'Livingston County',
  'Madison County',
  'Monroe County',
  'Montgomery County',
  'Nassau County',
  'New York County',
  'Niagara County',
  'Oneida County',
  'Onondaga County',
  'Ontario County',
  'Orange County',
  'Orleans County',
  'Oswego County',
  'Otsego County',
  'Putnam County',
  'Queens County',
  'Rensselaer County',
  'Richmond County',
  'Rockland County',
  'St. Lawrence County',
  'Saratoga County',
  'Schenectady County',
  'Schoharie County',
  'Schuyler County',
  'Seneca County',
  'Steuben County',
  'Suffolk County',
  'Sullivan County',
  'Tioga County',
  'Tompkins County',
  'Ulster County',
  'Warren County',
  'Washington County',
  'Wayne County',
  'Westchester County',
  'Wyoming County',
  'Yates County'
]


/** Convert NY data 'Test Date' (eg, '03/02/2020') to yyyy-mm-dd. */
function convertToYYYYMMDD (datestring) {
  const [ m, d, y ] = datestring.split('/')
  return [ y, m, d ].join('-')
}

module.exports = {
  state: 'iso2:US-NY',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'https://health.data.ny.gov/Health/New-York-State-Statewide-COVID-19-Testing/xdss-u53e',
    name: 'New York State Department of Health',
  },
  scrapers: [
    {
      startDate: '2020-03-02',
      crawl: [
        {
          type: 'csv',
          url: 'https://health.data.ny.gov/api/views/xdss-u53e/rows.csv?accessType=DOWNLOAD',
        },
      ],
      scrape (data, date) {
        // Disregarding timezone.  NY only reports things by date, so
        // there is no reason to assume that we need to shift data by
        // an offset.
        data = data.map(d => Object.assign(d, { YYYYMMDD: convertToYYYYMMDD(d['Test Date']) }))

        // Filter to only scrape the latest date ...
        const allDates = [ ...new Set(data.map(d => d.YYYYMMDD)) ].sort()
        const latestDate = allDates.slice(-1)[0]

        let filterDate = datetime.getYYYYMMDD(date)
        if (filterDate > latestDate)
          filterDate = latestDate
        console.log(`scraping data from ${filterDate}`)
        const todaysData = d => (d.YYYYMMDD === filterDate)

        const counties = data.filter(todaysData).map(row => {
          return {
            county: geography.addCounty(parse.string(row.County)),
            cases: parse.number(row['Cumulative Number of Positives']),
            tested: parse.number(row['Cumulative Number of Tests Performed']),
            date: row.YYYYMMDD    // Explicitly set the date.
          }
        })

        if (counties.length === 0) {
          throw new Error(`No data for filter date ${filterDate}`)
        }

        const result = geography.addEmptyRegions(counties, _counties, 'county')
        result.push({ ...transform.sumData(result), date: filterDate })
        return result
      }
    }
  ]
}
