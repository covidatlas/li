# Migrating from CDS to Li.

**NOTE: everything here is a work-in-progress, and may change!  If you are working with the data and note any discrepancies between this doc and the live data, please let us know by [opening an issue](https://github.com/covidatlas/li/issues/new/choose), notifying us on Slack, or (better yet!) updating the documentation and submitting a Pull Request.**

## Report endpoint

TBD

## Report replacements

| CDS report | Li report **(wip, currently code only, manual generation)** | Code (`src/scheduled/reports/`) |
| --- | --- | --- |
| features.json | TODO | TODO |
| locations.json | TODO | `_reports.js/locations()` |
| timeseries-byLocation.json | `_reports.js/timeseriesByLocation()` |
| timeseries-jhu.csv | `_reports.js/timeseriesJhu()` |
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

#### CDS record

```
{
    "Aargau, Switzerland": {
        "coordinates": [
            8.0725,
            47.378
        ],
        "country": "Switzerland",
        "countryId": "iso1:CH",
        "dates": {
            "2020-06-02": {
                "cases": 1177,
                "deaths": 43,
                "discharged": 1060
            },
            ...
            "2020-06-06": {
                "cases": 1177,
                "deaths": 43,
                "discharged": 1060,
                "growthFactor": 1
            }
        },
        "featureId": "iso2:CH-AG",
        "level": "state",
        "maintainers": [
            {
                "flag": "\ud83c\udde8\ud83c\udde6",
                "github": "qgolsteyn",
                "name": "Quentin Golsteyn"
            }
        ],
        "name": "Aargau, Switzerland",
        "population": 678207,
        "populationDensity": 485.70234973285847,
        "rating": 0.43137254901960786,
        "state": "Aargau",
        "stateId": "iso2:CH-AG",
        "tz": [
            "Europe/Zurich"
        ],
        "url": "https://github.com/daenuprobst/covid19-cases-switzerland/"
    },
```

#### Li record

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
    "populationDensity": 51.7139,
    "timeseries": {
      "2020-05-21": {
        "cases": 21,
        "deaths": 4,
        "tested": 210,
        "hospitalized": 1,
        "icu": 10
      },
      ...
    },
    "timeseriesSources": {
      "2020-05-21 .. 2020-06-18": "json-source"
    },
    "sources": [
      "json-source"
    ],
    "maintainers": [
      {
        "name": "John Smith",
        "github": "jsmith42"
      }
    ]
  }
```

##### Changes

* no rating
* tz is not in an array
* no url
* no featureId
* map location to geo using locationID
* add locationID (primary key for locations)

##### Multivalent data

The data fields in a given record can be supplied by many sources: one source may return cases and deaths, and another return hospitalizations and tests.  The field `timeseriesSources` shows where each field comes from.

A shorthand is shown for the date ranges for which the sources supplied data.  For example, `"2020-05-21 .. 2020-06-18": "json-source"` means that `json-source` supplied the data from 05-21 to 06-18.

If there are conflicts in the data (e.g., multiple sources return `cases`, but they're inconsistent), a `warnings` element is added.  e.g.,

```
  "warnings": {
    "2020-06-19": {
      "cases": "conflict (src1: 3, src2: 2, src3: 1)",
      "deaths": "conflict (src2: 22, src3: 11)"
    },
    ...
```


### timeseries-jhu.csv

#### CDS record

```
name,level,city,county,state,country,lat,long,population,url,aggregate,tz,2020-06-02,2020-06-03,...
"Lower Austria, Austria",state,,,Lower Austria,Austria,48.22100,15.7605,1653419,https:...js,,Europe/Vienna,2867,2868,...
```

#### Li record

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,2020-05-21,2020-05-22
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,22
```

* `locationID` is the canonical ID to use for a location
* `slug` may be used in future API calls (TBD!)

### timeseries-tidy.csv

#### CDS record

```
name,level,city,county,state,country,population,lat,long,aggregate,tz,date,type,value
"Lower Austria, Austria",state,,,Lower Austria,Austria,1653419,48.221000000000004,15.7605,,Europe/Vienna,2020-06-02,cases,2867
```

#### Li record

```

```

### timeseries.csv

- should be able to reproduce

### timeseries.json

Will not reproduce.  This file is not atomic; it relies on some external resource or resources, and it's not clear on its own.