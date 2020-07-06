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
          name: 'cases',
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/single-crawl-with-name/data.json'
        }
      ],
      scrape (cases) {
        const result = { cases: cases.count }
        return [ result ]
      }
    }
  ]
}
