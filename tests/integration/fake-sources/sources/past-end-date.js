module.exports = {
  country: 'iso1:US',
  state: 'CA',
  endDate: '2020-03-02',
  maintainers: [],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/past-end-date/result.json'
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
