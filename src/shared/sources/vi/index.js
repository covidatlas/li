const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = 'iso1:VI'

module.exports = {
  country,
  friendly: {
    name: 'United States Virgin Islands Department of Health',
    url: 'https://doh.vi.gov'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-01-01',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url:
            'https://doh.vi.gov/covid19usvi'
        }
      ],
      scrape ($, date, { getDataWithTestedNegativeApplied, normalizeKey }) {
        const mapping = {
          ignore: [ 'update', 'attention deficit', 'pending' ],
          deaths: 'death',
          testedNegative: 'negative',
          cases: 'positive',
          recovered: 'recovered'
        }
        const $paragraphs = $('.block-content p')
        const data = {}
        $paragraphs
          .filter((_index, paragraph) =>
            $(paragraph)
              .text()
              .includes(':')
          )
          .each((_index, paragraph) => {
            const text = $(paragraph)
              .text()
              .toLowerCase()
            const [ heading, valueIncludingParenthetical ] = text.split(':')
            const key = normalizeKey.normalizeKey( heading, mapping )
            const [ valueWithSlash ] = valueIncludingParenthetical.split('(')
            const [ value ] = valueWithSlash.split('/')
            if (key) {
              data[key] = parse.number(value)
            }
          })

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)

      }
    },
    {
      startDate: '2020-05-02',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url:
            'https://doh.vi.gov/covid19usvi'
        }
      ],
      scrape ($, date, { getDataWithTestedNegativeApplied, normalizeKey }) {
        const mapping = {
          ignore: [ 'active', 'negative', 'pending' ],
          deaths: 'deaths',
          cases: 'positive',
          recovered: 'recovered',
          tested: 'tested'
        }
        const $paragraphs = $("div[class*='views-field-field-covid-']")
        assert($paragraphs.length > 0, 'nothing found')
        const data = {}
        $paragraphs.each((_index, paragraph) => {
          const heading = $(paragraph)
            .find('.views-label')
            .text()
          const key = normalizeKey.normalizeKey( heading, mapping )
          if (key) {
            const value = $(paragraph)
              .find('.field-content')
              .text()
              .replace(/\/\d+/, '')
            data[key] = parse.number(value)
          }
        })

        assert(data.cases > 0, 'Cases are not reasonable')
        return getDataWithTestedNegativeApplied(data)
      }
    }
  ]
}
