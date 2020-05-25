const assert = require('assert')

module.exports = {
  country: 'iso1:US',
  state: 'CA',
  maintainers: [],
  friendly: {
    name: 'Canadian COVID Rolling Task Force',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          name: 'cases',
          type: 'json',
          paginated: async client => {
            const result = []
            let currentUrl = 'http://localhost:5555/tests/fake-source-urls/paginated-json/page1.json'
            while (currentUrl) {
              let { body } = await client( { url: currentUrl } )
              result.push(body)
              currentUrl = JSON.parse(body).nextUrl
            }
            return result
          }
        },
        {
          name: 'deaths',
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/paginated-json/deaths.json'
        },
      ],
      scrape ({ cases, deaths }) {
        assert(Array.isArray(cases, 'paginated data should be passed in as Array.'))

        const result = []
        for (let i = 0; i < cases.length; i++) {
          cases[i].records.forEach(rec => {
            result.push( { date: rec.date, cases: rec.cases, deaths: deaths.deaths, page: i } )
          })
        }
        return result
      }
    }
  ]
}
