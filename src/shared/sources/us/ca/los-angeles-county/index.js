const assert = require('assert')
const parse = require('../../../_lib/parse.js')
const maintainers = require('../../../_lib/maintainers.js')

module.exports = {
  county: 'Los Angeles County',
  state: 'iso2:US-CA',
  country: 'iso1:US',
  friendly: {
    name: 'County of Los Angeles Public Health',
    url: 'http://www.publichealth.lacounty.gov'
  },
  priority: 2,
  maintainers: [ maintainers.jbencina, maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-03-13',
      crawl: [
        {
          data: 'table',
          type: 'page',
          url: 'http://www.publichealth.lacounty.gov/media/Coronavirus/',
        },
      ],
      scrape ($) {
        return ({
          cases: parse.number(
            $('.counter')
              .first()
              .text()
          ),
          deaths: parse.number(
            $('.counter')
              .last()
              .text()
          )
        })
      }
    },
    {
      startDate: '2020-03-27',
      crawl: [
        {
          data: 'table',
          type: 'page',
          url: 'http://www.publichealth.lacounty.gov/media/Coronavirus/js/casecounter.js',
        },
      ],
      scrape ($) {
        const { content } = JSON.parse($.text().match(/data = (?<json>[\S\s]+?);/).groups.json)
        const data = {
          cases: parse.number(content.count),
          deaths: parse.number(content.death)
        }
        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
