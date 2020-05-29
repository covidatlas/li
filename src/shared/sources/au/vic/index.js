const assert = require('assert')
const maintainers = require('../../_lib/maintainers.js')
const parse = require('../../_lib/parse.js')

const baseUrl = 'https://www.dhhs.vic.gov.au'
const makeAbsoluteUrl = currentArticleHref => {
  if (currentArticleHref.startsWith('/')) {
    return `${baseUrl}${currentArticleHref}`
  }
  return currentArticleHref
}

const paragraphMatcher = ({ $, selector, regex }) => {
  const paragraph = $(selector)
    .text()
    .replace(/\u00a0/g, " ") // Replace &nbsp; chars with normal spaces
  const matches = paragraph.match(regex) || {}
  const { dataPoint } = matches.groups || {}
  return dataPoint ? parse.number(dataPoint) : undefined
}

module.exports = {
  country: 'iso1:AU',
  state: 'iso2:AU-VIC',
  friendly: {
    name: 'Victoria State Government Health and Human Services',
    url: baseUrl
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'page',
          data: 'paragraph',
          url: async (client) => {
            const { body } = await client({ url: 'https://www.dhhs.vic.gov.au/media-hub-coronavirus-disease-covid-19' })
            const matches = body.match(
              /<a href="(?<url>.+?)".*(?:Department of Health and Human Services media release)/
            )
            const url = matches && matches.groups && matches.groups.url
            assert(url, `no url found`)
            return ({ url: makeAbsoluteUrl(url) })
          }
        }
      ],
      scrape ($) {
        const data = {
          cases: paragraphMatcher({
            $,
            selector: `.page-content p:contains("cases in Victoria")`,
            regex: /cases in Victoria \w* (?<dataPoint>[\d,]+)/
          }),
          deaths: paragraphMatcher({
            $,
            selector: `.page-content p:contains("people have died")`,
            regex: /To date, (?<dataPoint>[\d,]+) people have died/
          }),
          recovered: paragraphMatcher({
            $,
            selector: `.page-content p:contains("have recovered")`,
            regex: /(?<dataPoint>[\d,]+) people have recovered/
          }),
          tested: paragraphMatcher({
            $,
            selector: `.page-content p:contains("More than")`,
            regex: /More than (?<dataPoint>[\d,]+) test/
          })
        }

        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
