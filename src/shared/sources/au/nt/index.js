const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-NT',
  priority: 2,
  friendly: {
    name: 'Northern Territory Government - Coronavirus site',
    url: 'https://coronavirus.nt.gov.au'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-04-09',
      crawl: [
        {
          type: 'page',
          data: 'table',
          url: 'https://coronavirus.nt.gov.au/'
        }
      ],
      scrape ($, date, { normalizeKey }) {
        const $rows = $('.header-widget div span, .header-widget p')
        const data = {}

        const mapping = {
          cases: 'confirmed cases',
          active: 'active',
          recovered: 'recovered',
          tested: 'tests conducted'
        }
        $rows.each((index, row) => {
          const $row = $(row)
          const [ value, ...headingWords ] = $row.text().split(' ')
          const heading = headingWords.join(' ')
          const numberInLabel = heading.match(/\d/)
          if (!numberInLabel) {
            const key = normalizeKey.normalizeKey(heading, mapping)
            data[key] = parse.number(value)
          }
        })
        return data
      }
    }
  ]
}
