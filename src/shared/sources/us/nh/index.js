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
      startDate: '2020-3-31',
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
      startDate: '2020-4-12',
      crawl: [
        {
          type: 'page',
          url: 'https://www.nh.gov/covid19/',
          data: 'table'
        },
      ],
      scrape ($, date, { normalizeTable }) {

        const $countyTable = $('.county-table')
        const data = normalizeTable({ $, table: $countyTable })

        const counties = []
        const Hillsborough = {
          county: 'Hillsborough County',
          cases: 0
        }
        data.forEach(row => {
          const [ name, cases ] = row
          if (name.includes('Hillsborough')) {
            Hillsborough.cases += parse.number(cases)
          } else if (!name.match(/County$|Total/)) {
            counties.push({
              county: name.includes('TBD') ? UNASSIGNED : geography.addCounty(name),
              cases: parse.number(cases)
            })
          }
        })
        counties.push(Hillsborough)

        const $summaryTable = $('.summary-list')
        const summary = normalizeTable({ $, table: $summaryTable })

        const getTableNumber = text => {
          const row = summary.find(s => s[0].includes(text))
          if (!row)
            return undefined
          return parse.number(row[1].split(' ')[0])
        }

        const casesTotal = getTableNumber('Number of Persons with COVID-191')
        const deathsTotal = getTableNumber('Deaths')
        const recoveredTotals = getTableNumber('Recovered')
        const testedTotals = getTableNumber('Tested Negative') + casesTotal
        const totals = {
          cases: casesTotal,
          deaths: deathsTotal,
          recovered: recoveredTotals,
          tested: testedTotals
        }
        counties.push(totals)
        return counties
      }
    }
  ]
}
