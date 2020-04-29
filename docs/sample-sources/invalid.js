/** An invalid scraper.
 *
 * This scraper has several errors and warnings.  The comments after
 * each bad line explain what's wrong.
 *
 * This source is actually validated during 'npm run test:unit',
 * to ensure that the proper errors and warnings are raised.
 */
module.exports = {
  country: 'badcode',
  // Error: 'Country must be a properly formatted ISO key (e.g. 'iso1:US')'

  state: 'badstate',
  aggregate: 'zipcode',

  // (normally, there would be a "maintainers: [ maintainers.aed3 ]," property here ...)
  // Warning: 'Missing maintainers, please list one or more!'

  scrapers: [

    {
      startDate: '2020-03-01',
      crawl: [
        {
          type: 'text',
          // Error: 2020-03-01: Invalid crawler type 'text';
          // must be one of: page, headless, csv, tsv, pdf, json, raw

          url: 'https://somedata.csv'
        }
      ],
      scrape (data) {
        /* ... etc. ... */
        return { cases: data.cases }
      }
    },

    {
      // (there should be a "startDate: '2020-03-02'," here)
      // Error: Scraper must contain a startDate

      crawl: [
        {
          name: 'default',
          // Error: (missing startDate): Single crawler must not have a name key

          type: 'csv',
          url: 'https://somedata.csv'
        }
      ],
      async scrape (data) {
        // Error: (missing startDate): Async scraper; scrapers should only contain synchronous logic.

        /* ... etc. ... */
        return { cases: data.infected }
      }
    },

    {
      startDate: '2020-03-03',
      crawl: [
        {
          name: 'default',
          // 2020-03-03: Single crawler must not have a name key

          type: 'csv',
          url: 'https://somedata.csv'
        }
      ]

      // Warning: 2020-03-03: Missing scrape method; please add scrape logic ASAP!
    },

    {
      startDate: '2020-03-02',
      crawl: [
        {
          name: 'cases',
          type: 'csv',
          url: 'https://somedata.csv'
        },
        {
          name: 'cases',
          // Error: 2020-03-02: Duplicate crawler name \'cases\'; names must be unique

          type: 'page',
          url: 'https://somedata.html'
        }
      ],
      scrape (data) {
        /* ... etc. ... */
        return { cases: 42 + data.count }
      }
    }
  ]
}
