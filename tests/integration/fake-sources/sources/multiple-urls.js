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
      // This crawls multiple URLs at once.
      crawl: [
        {
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/multiple-urls/cases.json',
          name: 'cases'
        },
        {
          type: 'json',
          url: 'http://localhost:5555/tests/fake-source-urls/multiple-urls/deaths.json',
          name: 'deaths'
        }
      ],
      scrape ( { cases, deaths } ) {
        return [ {
          cases: cases.count,
          deaths: deaths.count
        } ]
      }
    }
  ]
}
