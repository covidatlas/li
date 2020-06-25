module.exports = {
  country: 'iso1:US',
  state: 'CA',
  county: 'fips:06007',
  maintainers: [],
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
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/json-source/data.json'
        }
      ],
      scrape (json) {
        const record = {
          // TODO (testing) Add any fields that we need to check.
          cases: json.cases,
          deaths: json.deaths,
          tested: json.tested,
          hospitalized: json.hospitalized,
          icu: json.icu
        }
        if (json.date)
          record.date = json.date
        return record
      }
    }
  ]
}
