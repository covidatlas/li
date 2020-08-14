const assert = require('assert')
const srcShared = '../../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')


/** DC returns dates as e.g. "13-May", need to return "2020-05-13". */
function ddMmmToYYYYMMDD (s) {
  // Convert dates
  let [ d, m ] = s.split('-')
  m = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ].indexOf(m)
  if (m === -1)
    throw new Error(`unknown month in ${s}`)
  // Currently they store dates as eg 13-May ... how will they show the year later?
  if (m === 0)
    throw new Error('update code for 2021 dates')

  const ret = [ 2020, m + 1, parseInt(d, 10) ].
        map(n => ('' + n).padStart(2, '0')).
        join('-')
  return ret
}


module.exports = {

  state: 'iso2:US-DC',
  country: 'iso1:US',
  aggregate: 'state',
  priority: 1,
  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'https://coronavirus.dc.gov/page/coronavirus-data',
    name: 'Coronavirus Data',
  },
  scrapers: [
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'xlsx',

          // The page https://coronavirus.dc.gov/page/coronavirus-data
          // lists several hrefs to download xlsx files
          // (e.g. 'https://coronavirus.dc.gov/sites/default/files/dc/sites/coronavirus/page_content/attachments/DC-COVID-19-Data-for-August-13-2020.xlsx'),
          // get the latest one.
          url: async client => {
            const indexPage = 'https://coronavirus.dc.gov/page/coronavirus-data'
            const { body } = await client({ url: indexPage })
            const linkRe = /href="(?<relpath>.*?)"/g
            const matches = Array.from(body.matchAll(linkRe))
            const xlsxLinks = matches.
                  map(m => m.groups.relpath).
                  filter(r => r.match(/xlsx$/)).
                  filter(r => r.match(/DC-COVID-19-Data/)).
                  map(r => {
                    if (r.startsWith('https://'))
                      return r
                    if (r.startsWith('/'))
                      return `https://coronavirus.dc.gov${r}`
                    throw new Error(`unhandled link ${r}`)
                  })

            // Page is sorted from latest links to earliest.
            return { url: xlsxLinks[0] }
          }
        },
      ],
      scrape (workbook, date) {
        const sheetName = 'Overal Stats'
        assert(workbook.SheetNames.includes(sheetName), `Have ${sheetName}`)

        const stats = workbook.json[sheetName]

        /* DC data is an unwieldy array of hashes, eg:
          [
            {
              "__EMPTY_1": "Testing"
            },
            {
              "__EMPTY": "Testing",
              "__EMPTY_1": "Total Overall Tested",
              "13-Mar": "69",
              "14-Mar": "115",
              "15-Mar": "120",
          ...
          ]
        */

        // Conversion of types (in __EMPTY + __EMPTY_1) to correct Li properties:
        const typeToProperty = {
          'Testing: Total Overall Tested': 'tested',
          'Testing: Total Positives': 'cases',
          'Testing: Number of Deaths': 'deaths',
          // Testing: Cleared From Isolation
          // Hospitals: Total ICU Beds in Hospitals
          // Hospitals: ICU Beds Available
          // Hospitals: Total Reported Ventilators in Hospitals
          // Hospitals: In-Use Ventilators in Hospitals
          // Hospitals: Available Ventilators in Hospitals
          'Hospitals: Total COVID-19 Patients in DC Hospitals': 'hospitalized_current',
          'Hospitals: Total COVID-19 Patients in ICU': 'icu_current'
        }


        // Convert to single array of hashes, e.g.
        // [ {
        //    type: 'Testing: Number of Deaths',
        //    property: 'deaths',
        //    date: '2020-03-23',
        //    value: 85
        //  }, ... ]
        const rawData = stats.reduce((allRows, e) => {
          const dates = Object.keys(e).filter(f => f.match(/^\d+-[A-Z][a-z]+/))
          dates.reduce((arr, f) => {
            const type = [ e['__EMPTY'], e['__EMPTY_1'] ].join(': ')
            arr.push({
              type,
              property: typeToProperty[type],
              date: ddMmmToYYYYMMDD(f),
              value: parseInt(e[f].replace(',', ''), 10)
            })
            return arr
          }, allRows)
          return allRows
        }, [])

        // Validate.
        const allTypes = [ ...new Set(rawData.map(d => d.type)) ]
        const missingTypes = Object.keys(typeToProperty).filter(f => !allTypes.includes(f))
        assert(missingTypes.length === 0, `No missing types ${missingTypes}`)

        // Create Li-compatible records, keyed by date, e.g.:
        // { date1: { date: date1, cases: 2, deaths: 3 ... }, .... }
        const dataKeyedByDate = rawData.
              filter(d => d.property !== undefined).
              reduce((hsh, d) => {
                const rec = hsh[d.date] || { date: d.date }
                rec[d.property] = d.value
                hsh[d.date] = rec
                return hsh
              }, {})

        const data = Object.values(dataKeyedByDate).
              sort((a, b) => a.date < b.date ? -1 : 1)

        console.table(data)

        throw new Error('blah')

        /*
        // Dates are now yyyymmdd already, no conversion needed.
        const toYYYYMMDD = s => s

        const { filterDate, func } = timeseriesFilter(data, 'date', toYYYYMMDD, date)

        const rows = data.filter(func)

        if (rows.length === 0) {
          throw new Error(`No data for filter date ${filterDate}`)
        }
        if (rows.length > 1) {
          throw new Error(`${rows.length} rows returned for ${filterDate}`)
        }

        const result = []
        const row = rows[0]

        // Orleans county
        result.push({
          county: 'fips:22071',
          cases: row.NO_Cases,
          deaths: row.NO_Deaths,
          tested: row.NO_Total_Tests,
          // I don't feel we can rely on this data, as it doesn't
          // specify if these are covid hospitalizations/icu.  The
          // NO.hospitalized_current > LA.hospitalized_current if we
          // use this data, which doesn't make sense.  jz
          // icu_current: row.R1_ICU_Beds_In_Use,
          // hospitalized_current: row.R1_Beds_In_Use,
          date: filterDate
        })

        // State
        result.push({
          cases: row.LA_Cases,
          deaths: row.LA_Deaths,
          tested: row.LA_Total_Tests,
          hospitalized_current: row.LA_COVID_Hospitalizations,
          date: filterDate
        })

        return result
*/
      }
    }
  ]
}
