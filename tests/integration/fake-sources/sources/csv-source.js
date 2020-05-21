module.exports = {
  country: 'iso1:US',
  state: 'CA',
  friendly: {
    name: 'Canadian COVID Rolling Task Force',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  maintainers: [],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'csv',
          url: 'http://localhost:5555/tests/fake-source-urls/csv-source/data.csv'
        }
      ],
      scrape (data) {
        const result = []
        data.forEach(d => {
          result.push( {
            cases: d.cases,
            deaths: d.deaths
          } )
        })
        return result
      }
    }
  ]
}
