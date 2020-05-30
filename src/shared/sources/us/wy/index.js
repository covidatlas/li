// Migrated from coronadatascraper, src/shared/scrapers/US/WY/index.js

const srcShared = '../../../'
const geography = require(srcShared + 'sources/_lib/geography/index.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')
const transform = require(srcShared + 'sources/_lib/transform.js')

module.exports = {
  state: 'iso2:US-WY',
  country: 'iso1:US',
  aggregate: 'county',
  maintainers: [ maintainers.lazd ],
  friendly:   {
    url: 'https://health.wyo.gov/publichealth',
    name: 'Wyoming Department of Health',
    description: 'Public Health Division',
  },
  scrapers: [
    {
      startDate: '2020-03-20',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://health.wyo.gov/publichealth/infectious-disease-epidemiology-unit/disease/novel-coronavirus/'
        }
      ],
      scrape ($) {
        const counties = []
        const $p = $('strong:contains("Cases by County")').parent()
        const items = $p.html().
              split('<br>').
              map(s => s.replace(/<\/?strong>/g, ''))

        for (const item of items) {
          const pieces = item.split(':')
          const county = pieces[0]
          let count = pieces[1]

          if (county === 'Cases by County') {
            continue
          }
          if (count === undefined) {
            count = 0
          } else {
            count = parse.number(parse.string(count) || 0)
          }
          counties.push({
            county: geography.addCounty(parse.string(county)),
            cases: count
          })
        }

        counties.push(transform.sumData(counties))

        return counties

      }
    },
    {
      startDate: '2020-04-08',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: 'https://health.wyo.gov/publichealth/infectious-disease-epidemiology-unit/disease/novel-coronavirus/'
        }
      ],
      scrape ($) {

        const counties = []
        const $p = $('strong:contains("Albany")').parent()

        const items = $p.find('strong').toArray().map(p => $(p).text())

        for (const item of items) {
          const pieces = item.split(':')
          const county = pieces[0]

          let count = 0
          if (pieces[1]) {
            const [ , confirmed, probable ] = pieces[1].match(/(\d+)\s*\(*(\d+)*\)*/)
            count = parse.number(confirmed)

            if (probable !== undefined) {
              count += parse.number(probable)
            }
          }

          if (county === 'Cases by County') {
            continue
          }
          if (count === undefined) {
            count = 0
          }
          counties.push({
            county: geography.addCounty(parse.string(county)),
            cases: count
          })
        }

        counties.push(transform.sumData(counties))

        return counties
      }
    }
  ]
}
