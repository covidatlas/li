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
          url: 'http://localhost:5555/tests/fake-source-urls/fake/fake.json'
        }
      ],
      scrape (json) {
        return {
          // TODO (testing) Add any fields that we need to check.
          cases: json.cases,
          deaths: json.deaths,
          tested: json.tested,
          hospitalized: json.hospitalized
        }
      }
    }
  ]
}
