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
          paginated: {
            // The first page of data
            first: 'http://localhost:5555/tests/fake-source-urls/paginated-json/page1.json',

            // Next pages of data.  Should return null if no data.
            next: hsh => {
              const next = hsh.json.nextUrl
              if (!next)
                return null
              const url = `http://localhost:5555/tests/fake-source-urls/paginated-json/${next}`
              return Object.assign(hsh, { url })
            },

            // How to get records from a page.
            records: json => json.records
          }
        },
        {
          name: 'deaths',
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/paginated-json/deaths.json'
        },
      ],
      scrape ({ cases, deaths }) {
        const result = []
        cases.forEach(rec => {
          result.push( { counter: rec.counter, cases: rec.cases, deaths: deaths.deaths } )
        })
        return result
      }
    }
  ]
}
