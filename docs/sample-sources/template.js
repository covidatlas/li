// A template file.  Copy this to your directory, and fill in the items below.

const maintainers = require('../../src/shared/sources/_lib/maintainers.js')

module.exports = {

  /** Add the following directly to the scraper object if the data
   * you're pulling in is specific to a given location.
   */
  // ISO 3166-1 alpha-3 country code, see https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3
  country: 'xxx',
  // The state, province, or region
  state: 'xxx',
  // The county or parish
  county: 'xxx',
  // city name
  city: 'xxx',

  // TODO: I'm not sure what this field means.  jz
  aggregate: 'county',

  /** Optional flags: */

  // You *must* use this if the source provides timeseries data.  Use
  // false, or don't set this, if the source only provides the latest
  // data
  timeseries: true,

  // Use 'false' to skip certificate validation when running this
  // source (used to workaround certificate errors), otherwise omit.
  certValidation: false,

  // Any number (negative or positive). `0` is default, higher
  // priority wins if duplicate data is present, ties are broken by
  // rating (see "Source rating" in sources.md).
  priority: 0,

  // A user-friendly site to refer people to.
  friendly: {
    name: 'xxx',
    url: 'https://www.vvvv.com'
  },

  /** End optional flags. */


  /** Who contributed the source crawl and scrape.  This is included
   * in generated reports.  Array of objects with `{ name, url,
   * twitter, github, email }`, or the dev(s) can be included from the
   * maintainers.js module.
   */
  maintainers: [ maintainers.aed3 ],

  /** A set of source URLs to crawl (i.e., download and cache),
   * and the corresponding scrape method that is used to process
   * the data. */
  scrapers: [

    {
      startDate: 'yyyy-mm-dd',

      /** The set of URLs that will be pulled down and cached. */
      crawl: [
        {
          name: 'xxx',  // remove 'name' if there is only one URL to crawl
          type: 'xxx',  // page, headless, csv, tsv, pdf, json, raw
          url: 'your-url-here',
        },
        // ... other entries here.
      ],

      scrape (data) {
        // Do parsing of the data here, loading the result.
        let result = { cases: data.someparsing }
        // See docs/sources.md, "Scraping" for the structure of the
        // returned data.
        return result
      }
    },

    // Other scraper startDates here ...

  ]

}
