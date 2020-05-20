// Migrated from coronadatascraper, src/shared/scrapers/US/CA/orange-county.js

const srcShared = '../../../'
const assert = require('assert')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const parse = require(srcShared + 'sources/_lib/parse.js')

// Nice div'd layout on screen = annoying to get values.
function getHeadingValue ($, heading) {
  const h2s = $('h2').toArray()
  const h2 = h2s.find(
    h => $(h).text().trim().includes(heading)
  )
  assert(h2, `Found h2 with text ${heading}`)
  const cell = $(h2)
        .parent()
        .parent()
        .find('div.panel-body > h1')
  const txt = cell.text()
  assert(txt !== '', 'Have non-empty cell')
  return parse.number(txt)
}

module.exports = {
  county: 'fips:06059',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  maintainers: [ maintainers.jbencina ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          type: 'page',
          url: 'http://www.ochealthinfo.com/phs/about/epidasmt/epi/dip/prevention/novel_coronavirus',
        },
      ],
      scrape ($) {
        return {
          cases: parse.number(
            $('td:contains("Cases")')
              .next()
              .text()
          ),
          deaths: parse.number(
            $('td:contains("Total Deaths")')
              .next()
              .text()
          )
        }
      }
    },
    {
      startDate: '2020-03-18',
      crawl: [
        {
          type: 'page',
          url: 'https://occovid19.ochealthinfo.com/coronavirus-in-oc',
        },
      ],
      // TODO: cache is missing starting this day until -3-28
      // sha = 517447c21046ee6b261911b1d5e320d6
      // no cache present coronadatascraper-cache/2020-3-27/{sha}.html
      // Cache hit ... coronadatascraper-cache/2020-3-28/{sha}.html
      // eslint-disable-next-line
      scrape ($) {
        throw new Error('Need to scrape new page')
      }
    },
    {
      startDate: '2020-03-28',
      crawl: [
        {
          type: 'page',
          url: 'https://occovid19.ochealthinfo.com/coronavirus-in-oc',
        },
      ],
      scrape ($) {
        return {
          cases: getHeadingValue($, 'Cumulative Cases to Date'),
          deaths: getHeadingValue($, 'Cumulative Deaths to Date')
        }
      }
    },
    {
      startDate: '2020-04-24',
      crawl: [
        {
          type: 'page',
          url: 'https://occovid19.ochealthinfo.com/coronavirus-in-oc',
        },
      ],
      scrape ($) {
        return {
          cases: getHeadingValue($, 'Cumulative Cases to Date'),
          deaths: getHeadingValue($, 'Cumulative Deaths to Date'),
          tested: getHeadingValue($, 'Cumulative Tests To Date')
        }
      }
    }
  ]
}
