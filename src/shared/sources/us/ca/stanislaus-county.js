// Migrated from coronadatascraper, src/shared/scrapers/US/CA/stanislaus-county.js

const srcShared = '../../../'
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

function valueFor ($, heading) {
  const v = $(`p:contains("${heading}")`)
        .parent()
        .find('.counter')
        .last()
        .text()
  return parse.number(v)
}

module.exports = {
  county: 'fips:06099',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-14',
      crawl: [
        {
          type: 'page',
          url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
        },
      ],
      scrape ($) {
        return {
          cases: parse.number(
            $('.counter')
              .first()
              .text()
          )
        }
      }
    },
    {
      startDate: '2020-03-25',
      crawl: [
        {
          type: 'page',
          url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
        },
      ],
      scrape ($) {
        return {
          cases: valueFor($, 'Positive Cases'),
          deaths: valueFor($, 'Related Deaths')
        }
      }
    },
    {
      startDate: '2020-03-26',
      crawl: [
        {
          type: 'page',
          url: 'http://www.schsa.org/PublicHealth/pages/corona-virus/',
        },
      ],
      scrape ($) {
        const cases = valueFor($, 'Positive Cases')
        return {
          cases,
          deaths: valueFor($, 'Related Deaths'),
          recovered: valueFor($, 'Recovered Cases'),
          tested: cases + valueFor($, 'Negative Tests')
        }
      }
    }
  ]
}
