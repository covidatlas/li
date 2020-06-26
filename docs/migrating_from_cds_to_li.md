# Migrating from CDS to Li.

**NOTE: everything here is a work-in-progress, and may change!  If you are working with the data and note any discrepancies between this doc and the live data, please let us know by [opening an issue](https://github.com/covidatlas/li/issues/new/choose), notifying us on Slack, or (better yet!) updating the documentation and submitting a Pull Request.**

## Report endpoint

TBD

## Report replacements

| CDS report | Li report **(wip, currently code only, manual generation)** | Code (`src/scheduled/reports/`) |
| --- | --- | --- |
| features.json | TODO | TODO |
| locations.json | TODO | `_reports.js/locations()` |
| timeseries-byLocation.json | `_build-base-json.js` |
| timeseries-jhu.csv | TODO |
| timeseries-tidy.csv | TODO |
| timeseries.csv | TODO |
| timeseries.json | **Will not reproduce** |


### TODOs and comparison notes

#### features.json

- TODO - waiting for Zsolt's response re generating from geojson

#### locations.json

- TODO question - how to get the URL - can't do this all the time, some urls are dynamic and change; some URLs are _extremely_ long (arcgis)
- TODO load maintainers - locations are populated sometimes from multiple sources.

##### CDS record

```
  {
    "country": "Austria",
    "url": "https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js",
    "maintainers": [
      {
        "name": "Quentin Golsteyn",
        "github": "qgolsteyn",
        "flag": "<graphic>"
      }
    ],
    "sources": [
      {
        "url": "https://info.gesundheitsministerium.at",
        "name": "Austrian Ministry of Health"
      }
    ],
    "state": "Lower Austria",
    "rating": 0.5098039215686274,
    "coordinates": [
      15.7605,
      48.221000000000004
    ],
    "tz": [
      "Europe/Vienna"
    ],
    "featureId": "iso2:AT-3",
    "population": 1653419,
    "populationDensity": 86.1501096312734,
    "countryId": "iso1:AT",
    "stateId": "iso2:AT-3",
    "name": "Lower Austria, Austria",
    "level": "state"
  },

```

##### Li record

```
  {
    "locationID": "iso1:us#iso2:us-ca#fips:06007",
    "slug": "butte-county-california-us",
    "name": "Butte County, California, US",
    "coordinates": [
      -121.6,
      39.67
    ],
    "countryID": "iso1:US",
    "countryName": "United States",
    "population": 219186,
    "tz": "America/Los_Angeles",
    "level": "county",
    "stateID": "iso2:US-CA",
    "stateName": "California",
    "countyID": "fips:06007",
    "countyName": "Butte County",
    "created": "2020-06-26T01:21:44.104Z",
    "sources": [
      "json-source"
    ],
    "maintainers": [
      {
        "name": "John Smith",
        "github": "jsmith42"
      }
    ],
    "links": [
      {
        "name": "Canadian COVID Rolling Task Force",
        "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      }
    ],
    "populationDensity": 51.7139
  }
```

### timeseries-byLocation.json

- current data structure is returned by _build-base-json.js

Changes

TODO verify these changes

* no rating
* tz is not in an array
* no url
* no featureId
* map location to geo using locationID
* added locationID

### timeseries-jhu.csv

- should be able to reproduce

### timeseries-tidy.csv

- should be able to reproduce

### timeseries.csv

- should be able to reproduce

### timeseries.json

Will not reproduce.  This file is not atomic; it relies on some external resource or resources, and it's not clear on its own.