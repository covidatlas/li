const maintainers = require('../../src/shared/sources/_lib/maintainers.js')

module.exports = {
  country: 'iso1:xxx',
  state: 'iso2:xxx',
  county: 'xxx',

  maintainers: [ maintainers.aed3 ],

  scrapers: [
    {
      startDate: 'yyyy-mm-dd',
      crawl: [
        {
          type: 'xxx',
          url: 'https://your-url-here'
        },
      ],
      scrape (data, date, helpers) {
        let result = { cases: helpers.calculateSomething(date, data.someparsing) }
        return result
      }
    },
  ]

}
