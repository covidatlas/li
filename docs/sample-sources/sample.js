const parse = require('../../src/shared/sources/_lib/parse.js')
const maintainers = require('../../src/shared/sources/_lib/maintainers.js')

/** A valid source.
 *
 * While the crawl URLs and scrape functions are
 * fictitious, this scraper passes validation.
 *
 * This scraper is validated during 'npm run test:unit'
 */
module.exports = {

  /** The location this source covers. */
  country: 'iso1:US',
  state: 'iso2:CA',

  /** Who contributed the source crawl and scrape.  This is included
   * in generated reports.  Array of objects with `{ name, url,
   * twitter, github, email }`, or the dev(s) can be included from the
   * maintainers.js module.
   */
  maintainers: [ maintainers.aed3 ],

  /** You *must* specify 'timeseries: true' if the source provides
  * timeseries data.  Use false, or don't set this, if the source only
  * provides the latest data. */
  // timeseries: true,

  /** Optional flags: */

  aggregate: 'county',

  /** Use 'false' to skip certificate validation when running this
   * source (used to workaround certificate errors), otherwise
   * omit. */
  certValidation: false,

  /** Any number (negative or positive). `0` is default, higher
   * priority wins if duplicate data is present, ties are broken by
   * rating (see "Source rating" in sources.md). */
  priority: 0,

  /** A user-friendly site to refer people to. */
  friendly: {
    name: 'xxx',
    url: 'https://www.vvvv.com'
  },

  /** End optional flags. */

  /** A set of source URLs to crawl (i.e., download and cache),
   * and the corresponding scrape method that is used to process
   * the data. */
  scrapers: [

    {
      /** Each scraper has a 'startDate', when the crawl and scrape
       * start being valid for the location.  The URLs are crawled
       * and the cached data is scraped starting this date, until
       * the next startDate is hit in the list of scrapers.
       */
      startDate: '2020-03-01',

      /** The set of URLs that will be pulled down and cached. */
      crawl: [
        {
          /**  Types: page, headless, csv, tsv, pdf, json, raw */
          type: 'csv',
          url: 'https://somedata.csv'
        }
      ],

      /** This function will be called, and 'data' will be an object
       * containing the parsed CSV data.  The scrape method should
       * parse the data it receives into a hash with the appropriate
       * keys and values.
       *
       * If needed, scrape can also take two additional params:
       * scrape (data, date, helperFunctions)
       */
      scrape (data) {
        const counties = []
        for (const row of data) {
          counties.push({
            county: row.County,
            cases: parse.number(row.TotalCases)
          })
        }
        return counties
      }
    },

    {
      /** This location retired their old website and started serving
       * data in a different format, from multiple locations, starting
       * at 2020-03-15.  This set of crawl and scrape functions will
       * be used after that date for this source. */
      startDate: '2020-03-15',

      /** This source's data is partitioned over two websites.  Each
       * of the crawls is given a unique identifying name. */
      crawl: [
        {
          type: 'page',
          format: 'paragraph',
          url: 'https://someotherdata-cases.html',
          name: 'cases'
        },
        {
          type: 'page',
          format: 'table',
          url: 'https://someotherdata-deaths.html',
          name: 'deaths'
        }
      ],

      /** When scrape is called, it is given an object with two keys,
       * one for each crawl name. */
      // eslint-disable-next-line no-unused-vars
      scrape (data, date, helpers) {
        return {
          cases: data.cases,
          deaths: data.deaths
        }
      }
    }
  ]
}
