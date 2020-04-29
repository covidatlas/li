# Sources

In Li, a "source" is a Javascript class that provides lists of URLs that should be crawled, and methods to scrape the data from those pages.

This guide provides information on the criteria we use to determine whether a source should be added to the project, and offers details on how a source can be implemented.

## Examples

An anotated sample source is in `docs/sample-sources/sample.js`. It will give you a rough idea of the shape of a source, and how it is used.

Live sources are in `src/shared/sources/` as well.

## Criteria for sources

See [./source-criteria.md](Source criteria) to determine if a source should be included in this project.

## Writing a source

As shown in the samples, a `source` has `crawlers` which pull down data files (json, csv, html, pdf, tsv, raw), and `scrapers` which scrape those files and return useful data. Sources can pull in data for anything -- cities, counties, states, countries, or collections thereof. See the existing scrapers for ideas on how to deal with different ways of data being presented.

Copy the template in `docs/sample-sources/template.md` to a new file in the correct country, region, and region directory (e.g., `src/shared/sources/us/ca/mycounty-name.js`). That file contains some fields that you should fill in or delete, depending on the details of the source. Also see the comments in `docs/sample-sources/sample.js`, and below.

### Crawling

At the moment, we provide support for page, headless, csv, tsv, pdf, json, raw. A central controller will execute the source to crawl the provided URLs and cache the date. You just need to supply the `url`, `type`, and `name` if there are multiple urls to crawl.a

### Scraping

Scrapers are functions associated with the `scrape` attribute on `scrapers` in the `source`. You may implement one or multiple scrapers if the source changes its formatting (see [What to do if a scraper breaks?](#what-to-do-if-a-scraper-breaks)).

Your scraper should return an object, an array of objects, or `null`.

#### The returned scrape results object

The object may have the following attributes:

```javascript
result = {
  // [ISO 3166-1 alpha-3 country code](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3) [required]
  country: 'iso1:xxx',

  // The state, province, or region (not required if defined on scraper object)
  state: 'iso2:xxx',

  // The county or parish (not required if defined on scraper object)
  county: 'xxx',

  // The city name (not required if defined on scraper object)
  city: 'xxx',

  // Total number of cases
  cases: 42,

  // Total number of deaths
  deaths: 42,

  // Total number of hospitalized
  hospitalized: 42,

  // Total number of discharged
  discharged: 42,

  // Total number recovered
  recovered: 42,

  // Total number tested
  tested: 42,

  // GeoJSON feature associated with the location (See [Features and population data](#features-and-population-data))
  feature: 'xxx',

  // Additional identifiers to aid with feature matching (See [Features and population data](#features-and-population-data))
  featureId: 'xxx',

  // The estimated population of the location (See [Features and population data](#features-and-population-data))
  population: 42,

  // Array of coordinates as `[longitude, latitude]` (See [Features and population data](#features-and-population-data))
  coordinates: 'xxx',
}
```

#### Returning an array

Returning an array of objects is useful for aggregate sources, sources that provide information for more than one geographical area. For example, [Canada](https://www.canada.ca/en/public-health/services/diseases/2019-novel-coronavirus-infection.html?topic=tilelink) provides information for all provinces of the country. If the scraper returns an array, each object in the array will have the attributes specified in the source object appended, meaning you only need to specify the fields that change per location (`county`, `cases`, `deaths` for example).

#### Returning `null`

`null` should be returned in case no data is available. This could be the case if the source has not provided an update for today, or we are fetching historical information for which we have no cached data.

## Making sure your scraper doesn't break

It's a tough challenge to write scrapers that will work when websites are inevitably updated. Here are some tips:

- If your source is an HTML table, validate its structure: check that   table headers contain expected text, that columns exist, etc. For   example, if you say `result.deaths` is the value stored in column 2,   but the source has changed column 2 from "Deaths" to "Cases", your   scrape will complete successfully, but the data won't be correct.

- If data for a field is not present (eg. no recovered information),   **do not put 0 for that field**. Make sure to leave the field   undefined so the scraper knows there is no information for that   particular field.

- Write your scraper so it handles aggregate data with a single   scraper entry (i.e. find a table, process the table)

- Try not to hardcode county or city names, instead let the data on   the page populate that

- Try to make your scraper less brittle by avoiding using generated   class names (i.e. CSS modules)

- When targeting elements, don't assume order will be the same   (i.e. if there are multiple `.count` elements, don't assume the   second one is deaths, verify it by parsing the label)


### What to do if a scraper breaks?

Source scrapers need to be able to operate correctly on old data, so updates to scrapers must be backwards compatible. If you know the date the site broke, you can have two implementations (or more) of a scraper in the same function, based on date. Most sources in `src/shared/sources` deal with such cases.

## Features and population data

We strive to provide a GeoJSON feature and population number for every location in our dataset. When adding a source for a country, we may already have this information and can populate it automatically. For smaller regional entities, this information may not be available and has to be added manually.

### Features

Features can be specified in three ways: through the `country`, `state` and `county` field, by matching the `longitude` and `latitude` to a particular feature, through the `featureId` field, or through the `feature` field.

While the first two methods works most of the time, sometimes you will have to rely on `featureId` to help the crawler make the correct guess. `featureId` is an object that specifies one or more of the attributes below:

- `name`
- `adm1_code`
- `iso_a2`
- `iso_3166_2`
- `code_hasc`
- `postal`

In case we do not have any geographical information for the location you are trying to scrape, you can provide a GeoJSON feature directly in the `feature` attribute you can return with the scraper.

If we have a feature for the location, we will calculate a `longitude` and `latitude`. You may also specify a custom longitude and latitude by specifying a value in the `coordinates` attribute.

### Population

Population can usually be guessed automatically, but if that is not the case, you can provide a population number by returning a value for the `population` field in the returned object of the scraper.

## Testing sources

You should test your source first by running `npm run test`. This will perform some basic tests to make sure nothing crashes and the source object is in the correct form.

### Test coverage

We run scrapes periodically for every cached file, for every source.

If you change a source, it will be exercised when you run `npm run test:integration`. See [Testing](./testing.md) for more information.