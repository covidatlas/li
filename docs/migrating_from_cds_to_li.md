# Migrating from CDS to Li.

**NOTE: everything here is a work-in-progress, and may change!  If you are working with the data and note any discrepancies between this doc and the live data, please let us know by [opening an issue](https://github.com/covidatlas/li/issues/new/choose), notifying us on Slack, or (better yet!) updating the documentation and submitting a Pull Request.**

## Report endpoint

TBD

## Report replacements

| CDS report | Li report **(wip, currently code only, manual generation)** |
| --- | --- |
| features.json | TODO |
| locations.json | TODO |
| timeseries-byLocation.json | IN PROGRESS |
| timeseries-jhu.csv | TODO |
| timeseries-tidy.csv | TODO |
| timeseries.csv | TODO |
| timeseries.json | Will not reproduce |


### TODOs and comparison notes

#### features.json

- TODO - waiting for Zsolt's response re generating from geojson
#### locations.json

- TODO question - how to get the URL - can't do this all the time, some urls are dynamic and change; some URLs are _extremely_ long (arcgis)
- TODO load maintainers - locations are populated sometimes from multiple sources.

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