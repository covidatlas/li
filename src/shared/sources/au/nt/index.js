const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const schemaKeysByHeadingFragment = {
  'confirmed cases': 'cases',
  'active cases': 'active',
  'people recovered': 'recovered',
  'tests conducted': 'tested'
}

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
      scrape ($, date, { getSchemaKeyFromHeading }) {
        const $rows = $('.header-widget div span, .header-widget p')
        const data = {}
        $rows.each((index, row) => {
          const $row = $(row)
          const [ value, ...headingWords ] = $row.text().split(' ')
          const heading = headingWords.join(' ')
          const numberInLabel = heading.match(/\d/)
          if (!numberInLabel) {
            const key = getSchemaKeyFromHeading({ heading, schemaKeysByHeadingFragment })
            data[key] = parse.number(value)
          }
        })
        return data
      }
    }
  ]
}
