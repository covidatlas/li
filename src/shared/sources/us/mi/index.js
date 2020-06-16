// Migrated from coronadatascraper, src/shared/scrapers/US/MI/index.js

const srcShared = '../../../'
const assert = require('assert')
const constants = require(srcShared + 'sources/_lib/constants.js')
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

const DetroitCity = 'Detroit City'
const WayneCounty = 'Wayne County'


const _counties = [
  'Alcona County',
  'Alger County',
  'Allegan County',
  'Alpena County',
  'Antrim County',
  'Arenac County',
  'Baraga County',
  'Barry County',
  'Bay County',
  'Benzie County',
  'Berrien County',
  'Branch County',
  'Calhoun County',
  'Cass County',
  'Charlevoix County',
  'Cheboygan County',
  'Chippewa County',
  'Clare County',
  'Clinton County',
  'Crawford County',
  'Delta County',
  'Dickinson County',
  'Eaton County',
  'Emmet County',
  'Genesee County',
  'Gladwin County',
  'Gogebic County',
  'Grand Traverse County',
  'Gratiot County',
  'Hillsdale County',
  'Houghton County',
  'Huron County',
  'Ingham County',
  'Ionia County',
  'Iosco County',
  'Iron County',
  'Isabella County',
  'Jackson County',
  'Kalamazoo County',
  'Kalkaska County',
  'Kent County',
  'Keweenaw County',
  'Lake County',
  'Lapeer County',
  'Leelanau County',
  'Lenawee County',
  'Livingston County',
  'Luce County',
  'Mackinac County',
  'Macomb County',
  'Manistee County',
  'Marquette County',
  'Mason County',
  'Mecosta County',
  'Menominee County',
  'Midland County',
  'Missaukee County',
  'Monroe County',
  'Montcalm County',
  'Montmorency County',
  'Muskegon County',
  'Newaygo County',
  'Oakland County',
  'Oceana County',
  'Ogemaw County',
  'Ontonagon County',
  'Osceola County',
  'Oscoda County',
  'Otsego County',
  'Ottawa County',
  'Presque Isle County',
  'Roscommon County',
  'Saginaw County',
  'St. Clair County',
  'St. Joseph County',
  'Sanilac County',
  'Schoolcraft County',
  'Shiawassee County',
  'Tuscola County',
  'Van Buren County',
  'Washtenaw County',
  'Wayne County',
  'Wexford County',
]

module.exports = {
  state: 'iso2:US-MI',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    url: 'https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html',
    name: 'Michigan Department of Health & Human Services',
  },
  scrapers: [
    {
      startDate: '2020-03-22',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://www.michigan.gov/coronavirus/0,9753,7-406-98163-520743--,00.html',
        },
      ],
      scrape ($, date, { normalizeKey } ) {

        // The webpage breaks out Detroit, which is in Wayne County.
        // The table does not include Detroit's numbers in the Wayne County totals.
        // So we have to roll that up ourselves.
        let detroitCases = 0
        let detroitDeaths = 0

        const $cap = $('caption:contains("Confirmed COVID-19 Cases")')
        const $table = $cap.closest('table')
        const $headings = $table.find('thead > tr > th')
        assert($headings.length, 'no headings found')
        const headings = $headings.toArray().map(h => $(h).text())

        const mappings = {
          county: /county/i,
          cases: /cases/i,
          deaths: /deaths/i
        }
        const indices = normalizeKey.propertyColumnIndices(headings, mappings)

        // Convert table to raw data, ignoring total rows.
        const rawData = []
        const $trs = $table.find('tbody > tr')
        $trs.each((index, tr) => {
          const tds = $(tr).find('td').toArray().map(td => $(td).text().trim())
          const row = normalizeKey.createHash(indices, tds)
          if (![ 'County', 'Totals', 'Grand Total', 'Total' ].includes(row.county))
            rawData.push(row)
        })

        function fixCounty (text) {
          // Ignore asterisks (that indicate footnotes).
          let s = text.replace(/\*/g, '')

          // MDOC = Michigan Dept of Corrections
          // FCI = Federal Correctional Institute
          const unknown = [ 'Out of State', 'Other', 'Not Reported', 'Unknown' ]
          if (unknown.includes(s) || s.match(/MDOC/) || s.match(/FCI/))
            return constants.UNASSIGNED

          // TODO (scrapers) Detroit handling is far too hacky.
          if (s === 'Detroit City')
            return s

          // Final fixes
          return geography.addCounty(s.replace('St ', 'St. '))
        }

        const data = rawData.
              map(r => {
                return {
                  county: fixCounty(r.county),
                  cases: r.cases,
                  deaths: r.deaths
                }
              })

        let counties = []

        data.filter(d => d.county !== constants.UNASSIGNED).forEach(rowData => {

          // Remember these to add them to Wayne County instead
          // TODO (scraper) Handling of Detroit is completely brittle.
          if (rowData.county === DetroitCity) {
            detroitCases = rowData.cases
            detroitDeaths = rowData.deaths
          }

          if (rowData.county === WayneCounty) {
            rowData.cases += detroitCases
            rowData.deaths += detroitDeaths
          }

          if (rowData.county === DetroitCity) {
            counties.push({
              city: rowData.county,
              county: WayneCounty,
              cases: rowData.cases,
              deaths: rowData.deaths
            })
            return
          }

          counties.push({
            county: rowData.county,
            cases: rowData.cases,
            deaths: rowData.deaths
          })

        })

        // Handle unassigned.
        const unassigned = data.filter(d => d.county === constants.UNASSIGNED).
              reduce((hsh, r) => {
                hsh.cases += r.cases
                hsh.deaths += r.deaths
                return hsh
              }, { cases: 0, deaths: 0 })
        counties.push({ county: constants.UNASSIGNED, ...unassigned })

        counties = geography.addEmptyRegions(counties, _counties, 'county')
        counties.push(transform.sumData(counties))

        return counties
      }
    }
  ]
}
