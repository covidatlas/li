// Migrated from coronadatascraper, src/shared/scrapers/US/NY/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
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

        function toYYYYMMDD (datestring) {
          const [ m, d, y ] = datestring.split('/')
          return [ y, m, d ].join('-')
        }

        const { filterDate, func } = timeseriesFilter(data, 'Test Date', toYYYYMMDD, date)

        const counties = data.filter(func).map(row => {
          return {
            county: geography.addCounty(parse.string(row.County)),
            cases: parse.number(row['Cumulative Number of Positives']),
            tested: parse.number(row['Cumulative Number of Tests Performed']),
            date: filterDate    // Explicitly set the date.
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
