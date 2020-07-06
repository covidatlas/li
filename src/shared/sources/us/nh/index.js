// Migrated from coronadatascraper, src/shared/scrapers/US/NH/index.js


const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')
const { UNASSIGNED } = require(srcShared + 'sources/_lib/constants.js')


const _counties = [
  'Coos',
  'Grafton',
  'Carroll',
  'Belknap',
  'Merrimack',
  'Sullivan',
  'Cheshire',
  'Hillsborough',
  'Rockingham',
  'Strafford'
]


/** NH reports their data in a summary table with row headings. */
function getTableNumber (summary, text) {
  const rows = summary.
        filter(row => row[0].includes(text))
  if (rows.length === 0)
    return undefined

  // Some data is reported on multiple rows;
  // e.g., 'Total Persons Tested  at Selected Laboratories, Polymerase Chain Reaction',
  // 'Total Persons Tested  at Selected Laboratories, Antibody Laboratory Tests'
  const total = rows.
        map(row => row[1].split(' ')[0]).
        map(s => parse.number(s)).
        reduce((sum, v) => sum + v, 0)
  return total
}


module.exports = {
  state: 'iso2:US-NH',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.qgolsteyn ],
  friendly:   {
    name: 'New Hampshire Department of Health and Human Services',
    url: 'https://www.nh.gov/covid19/',
  },
  scrapers: [
    {
      startDate: '2020-03-23',
      crawl: [
        {
          type: 'pdf',
          url: 'https://www.nh.gov/covid19/documents/case-map.pdf',
        },
      ],
      scrape (body, date, { pdfUtils } ) {
        const rows = pdfUtils.asWords(body, 0, 1000).map(row => row[0])
        const counties = []
        for (const county of _counties) {
          const countyItem = rows.find(row => row.text === county)
          let cases = parse.number(
            pdfUtils
              .getNearest(countyItem, rows) // Sort items by nearest in PDF
              .find(item => !Number.isNaN(parse.number(item))) // Include first that is not a number
          )
          if (county === 'Hillsborough') {
            // We need to include cases for cities within this county that are counted separately
            cases += parse.number(
              pdfUtils.getNearest(
                rows.find(row => row.text === 'Manchester'),
                rows
              )[1]
            )
            cases += parse.number(
              pdfUtils.getNearest(
                rows.find(row => row.text === 'Nashua'),
                rows
              )[2]
            )
          }
          counties.push({
            county: geography.addCounty(county),
            cases: parse.number(cases)
          })
        }
        counties.push(transform.sumData(counties))
        return counties

      }
    },
    {
      startDate: '2020-03-31',
      crawl: [
        {
          type: 'pdf',
          url: 'https://www.nh.gov/covid19/documents/case-map.pdf',
        },
      ],
      scrape () {
        throw new Error('New Hampshire stopped reporting county-level data as of 2020/3/31')
      }
    },
    {
      startDate: '2020-04-12',
      crawl: [
        {
          type: 'page',
          url: 'https://www.nh.gov/covid19/',
          data: 'table'
        },
      ],
      scrape ($, date, { normalizeTable }) {
        const counties = []

        const $countyTable = $('.county-table')
        const data = normalizeTable({ $, table: $countyTable })

        const Hillsborough = {
          county: 'Hillsborough County',
          cases: 0
        }
        data.forEach(row => {
          const [ name, cases ] = row
          if (name.includes('Hillsborough')) {
            Hillsborough.cases += parse.number(cases)
          } else if (!name.match(/County$|Total/)) {
            const isUnassigned = [ 'TBD', 'Unknown', 'TBA' ].some(s => name.includes(s))
            counties.push({
              county: isUnassigned ? UNASSIGNED : geography.addCounty(name),
              cases: parse.number(cases)
            })
          }
        })
        counties.push(Hillsborough)

        const $summaryTable = $('.summary-list')
        const summary = normalizeTable({ $, table: $summaryTable })
        // console.log(JSON.stringify(summary))
        const totals = {
          cases: getTableNumber(summary, 'Number of Persons with COVID-19'),
          deaths: getTableNumber(summary, 'Deaths'),
          recovered: getTableNumber(summary, 'Recovered'),
          hospitalized: getTableNumber(summary, 'Persons Who Have Been Hospitalized'),
          tested: getTableNumber(summary, 'Number of Persons with COVID-19') +
            (getTableNumber(summary, 'Tested Negative') || 0) +
            (getTableNumber(summary, 'Total Persons Tested') || 0)
        }
        counties.push(totals)
        return counties
      }
    },
    {
      startDate: '2020-05-31',
      crawl: [
        {
          type: 'page',
          url: 'https://www.nh.gov/covid19/',
          data: 'table'
        },
      ],
      scrape ($, date, { normalizeTable }) {
        const counties = []

        /* NH started reported their county data in an unparsable PDF map via Tableau. */

        const $summaryTable = $('.summary-list')
        const summary = normalizeTable({ $, table: $summaryTable, tableSelector: 'barf' })

        const totals = {
          cases: getTableNumber(summary, 'Number of Persons with COVID-19'),
          deaths: getTableNumber(summary, 'Deaths'),
          recovered: getTableNumber(summary, 'Recovered'),
          hospitalized: getTableNumber(summary, 'Persons Who Have Been Hospitalized'),
          tested: getTableNumber(summary, 'Number of Persons with COVID-19') +
            (getTableNumber(summary, 'Tested Negative') || 0) +
            (getTableNumber(summary, 'Total Persons Tested') || 0)
        }
        counties.push(totals)
        return counties
      }
    }
  ]
}
