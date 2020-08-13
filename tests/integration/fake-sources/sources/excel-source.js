module.exports = {
  country: 'iso1:US',
  state: 'CA',
  county: 'fips:06007',
  maintainers: [ { name: 'John Smith', github: 'jsmith42' } ],
  priority: 1,
  friendly: {
    name: 'Canadian COVID Rolling Task Force',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
  },
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'xlsx',
          url: 'http://localhost:5555/tests/fake-source-urls/excel-source/excel-data.xlsx'
        }
      ],
      scrape (data) {
        // can get json referring to sheets by name.
        // Not bothering to return realistic records for the tests.
        const cases = data.json['cases'].map(d => Object.assign(d, { type: 'cases' }))
        const deaths = data.json['deaths'].map(d => Object.assign(d, { type: 'deaths' }))
        return cases.concat(deaths)
      }
    }
  ]
}
