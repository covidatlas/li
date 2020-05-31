// Migrated from coronadatascraper, src/shared/scrapers/US/NV/carson-city.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const assert = require('assert')

const _counties = [
  'Carson City',
  'Douglas County',
  'Lyon County',
  'Storey County'
]

module.exports = {
  state: 'iso2:US-NV',
  country: 'iso1:US',
  aggregate: 'county',
  certValidation: false,
  maintainers: [ maintainers.jzohrab ],
  friendly:   {
    name: 'Carson City Health and Human Services',
    url: 'https://gethealthycarsoncity.org/',
    description: 'Carson City Health and Human Services - Aggregate for Quad County region: ' + _counties.join(', ')
  },
  scrapers: [
    {
      startDate: '2020-03-29',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://gethealthycarsoncity.org/novel-coronavirus-2019/',
        },
      ],
      scrape ($) {
        const $table = $('table')
        assert.equal($table.length, 1, 'Table not found')
        const $trs = $table.find('tbody > tr:not(:first-child)')
        const counties = []
        $trs.each((index, tr) => {
          const $tr = $(tr)
          const name = parse.string($tr.find('td:first-child').text())
          if (name === 'TOTAL') {
            return
          }
          counties.push({
            county: name,
            cases: parse.number($tr.find('td:nth-child(2)').text()),
            active: parse.number($tr.find('td:nth-child(3)').text()),
            recovered: parse.number($tr.find('td:nth-child(4)').text()),
            deaths: parse.number($tr.find('td:last-child').text())
          })
        })
        return counties
      }
    },
    {
      startDate: '2020-04-19',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://gethealthycarsoncity.org/novel-coronavirus-2019/covid-19-by-county/',
        }
      ],
      // eslint-disable-next-line
      scrape (data) {
        throw new Error('data layout changed to a bunch of DIVs at this URL'
                       )
      }
    },
    {
      startDate: '2020-04-20',
      crawl: [
        {
          type: 'headless',
          data: 'table',
          url: 'https://gethealthycarsoncity.org/novel-coronavirus-2019/covid-19-by-county/',
          options: { disableSSL: true }
        },
      ],
      scrape ($) {
        const div = $('.post-content')
        assert.equal(div.length, 1, 'Table not found')
        const records = div.find('.fusion-fullwidth:not(:first-child)')
        const counties = []
        records.toArray().forEach(record => {
          const $record = $(record)
          const name = parse.string($record.find('.title').text())
          if (name === 'TOTAL') {
            return
          }
          const displayCounterValue = index => {
            return parse.number(
              $record.find('.display-counter')
                .eq(index)
                .data('value')
            ) || 0
          }
          counties.push({
            county: name,
            cases: displayCounterValue(0),
            active: displayCounterValue(1),
            recovered: displayCounterValue(2),
            deaths: displayCounterValue(3)
          })
        })
        // console.table(counties)
        return counties
      }
    }
  ]
}
