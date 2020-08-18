// Migrated from coronadatascraper, https://github.com/covidatlas/coronadatascraper/pull/1027/files

const srcShared = '../../../'
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')


const _countyMap = {
  'KANSAS CITY': 'JACKSON COUNTY',
  'ST LOUIS': 'ST. LOUIS COUNTY',
  'ST CHARLES': 'ST. CHARLES COUNTY',
  'ST CLAIR': 'ST. CLAIR COUNTY',
  'STE GENEVIEVE': 'STE. GENEVIEVE COUNTY',
  'ST FRANCOIS': 'ST. FRANCOIS COUNTY',
  'JOPLIN': 'JASPER COUNTY',
  'ST LOUIS CITY': 'ST. LOUIS CITY',
}

/** Using arcgis functions to determine test counts. */
function arcgisPagination () {
  const url = 'https://services6.arcgis.com/Bd4MACzvEukoZ9mR/arcgis/rest/services/Daily_COVID19_Testing_Report_for_OPI/FeatureServer/0/query'
  const arcgisArgs = {
    groupByFieldsForStatistics: 'county,result,test_date',
    outStatistics: '[{"statisticType":"count","onStatisticField":"*","outStatisticFieldName":"Count"}]'
  }
  return arcgis.paginated(url, arcgisArgs)
}

module.exports = {
  state: 'iso2:US-MO',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.dcardon, maintainers.jzohrab ],
  friendly:   {
    name: 'Missouri Department of Health and Senior Services',
    url: 'https://health.mo.gov/living/healthcondiseases/communicable/novel-coronavirus/'
  },
  scrapers: [
    {
      startDate: '2020-08-01',
      crawl: [
        {
          type: 'json',
          paginated: arcgisPagination()
        }
      ],
      scrape (data, date) {
        // The arcgis query returns json like:
        // Count; county; result; test_date
        // 1, ADAIR, Negative, 1584358920000
        // 17, ADAIR, Positive, 1584360840000
        // 2, STE GENEVIEVE, Positive, 1584360840000
        // The Count is not cumulative.

        const getYYYYMMDD = n => new Date(n).toISOString().split('T')[0]
        const { func, filterDate } = timeseriesFilter(data, 'test_date', getYYYYMMDD, date, { operator: '<=' })
        const sumPerCounty = data.filter(func).reduce((hsh, rec) => {
          const c = rec.county
          hsh[c] = hsh[c] || 0
          hsh[c] += rec.Count
          return hsh
        }, {})

        return Object.entries(sumPerCounty).
          map(pair => {
            let county = pair[0]
            county = _countyMap[county] || county
            return {
              county,
              tested: pair[1],
              date: filterDate
            }
          })
      }
    }
  ]
}

