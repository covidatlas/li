module.exports = {
  country: 'iso1:US',
  state: 'CA',
  county: 'FakeCounty',
  maintainers: [],
  friendly: {
    name: 'Fake source',
    url: 'rick-roll-url'
  },
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'json',
          url: 'localhost:3000/test/integration/2020-03-01.json'
        }
      ],
      scrape (json) {
        return {
          cases: json.cases,
          deaths: json.deaths
        }
      }
    }
  ]
}
