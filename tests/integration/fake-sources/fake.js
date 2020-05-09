module.exports = {
  country: 'iso1:US',
  state: 'CA',
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
          url: 'http://localhost:5555/tests/fake-source-urls/fake/fake.json'
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
