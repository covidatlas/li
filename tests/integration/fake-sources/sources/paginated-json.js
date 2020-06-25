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
            const baseUrl = 'http://localhost:5555/tests/fake-source-urls/paginated-json'
            let currentUrl = 'page1.json'
            while (currentUrl) {
              const url = `${baseUrl}/${currentUrl}`
              let { body } = await client( { url } )
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
            result.push( { counter: rec.counter, cases: rec.cases, deaths: deaths.deaths, page: i } )
          })
        }
        return result
      }
    }
  ]
}
