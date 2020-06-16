const assert = require('assert')
const maintainers = require('../_lib/maintainers.js')
const parse = require('../_lib/parse.js')

const country = `iso1:TW`

const propertyMap = {
  送驗: 'tested',
  排除: null, // Negative Tests
  確診: 'cases',
  死亡: 'deaths',
  解除隔離: 'recovered',
}

module.exports = {
  country,
  priority: 1,
  friendly: {
    name: 'Taiwan CDC',
    url: 'https://cdc.gov.tw/'
  },
  maintainers: [ maintainers.camjc ],
  scrapers: [
    {
      startDate: '2020-05-04',
      crawl: [
        {
          type: 'json',
          url: 'https://covid19dashboard.cdc.gov.tw/dash3',
          headers: {
            'Origin': 'https://919644827-atari-embeds.googleusercontent.com'
          }
        },
      ],
      scrape ($) {
        const data = {}
        for (const [ heading, value ] of Object.entries($['0'])) {
          const prop = propertyMap[heading]
          if (prop) {
            data[prop] = parse.number(value)
          }
        }
        assert(data.cases > 0, 'Cases are not reasonable')
        return data
      }
    }
  ]
}
