module.exports = {
  country: 'iso1:FR',
  state: 'iso2:XX-XX',
  maintainers: [ { name: 'rick' } ],
  scrapers: [
    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/bad-iso/data.json'
        }
      ],
      scrape (json) { return { cases: json.cases } }
    }
  ]
}
