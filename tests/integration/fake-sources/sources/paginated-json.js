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
        }
      ],
      scrape (json) {
        const result = []
        for (let i = 0; i <= json.length; ++i) {
          json[i].forEach(rec => {
            result.push( { date: rec.date, cases: rec.cases, page: i } )
          })
        }
        return result
      }
    }
  ]
}
