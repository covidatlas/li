- [General notes](#general-notes)
- [Locations](#locations)
  * [locations.json](#locationsjson)
  * [locations.csv](#locationscsv)
  * [features.json](#featuresjson)
- [Latest](#latest)
  * [latest.json](#latestjson)
  * [latest.csv](#latestcsv)
- [Timeseries](#timeseries)
  * [timeseries-byLocation.json](#timeseries-bylocationjson)
    - [Combining Data Sources](#combining-data-sources)
  * [timeseries-jhu.csv](#timeseries-jhucsv)
  * [timeseries-tidy-small.csv](#timeseries-tidy-smallcsv)
  * [timeseries.csv](#timeseriescsv)

<!-- <small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small> -->

# General notes

* **locationID:** Every location in Li is identified with a unique `locationID`, comprised of iso1, iso2, and fips codes from https://github.com/hyperknot/country-levels.  Examples: `iso1:US` = United States, `iso1:us#iso2:us-al` = State of Alabama, `iso1:us#iso2:us-al#fips:01125` = Tuscaloosa County, Alabama.
* **slug:** Many reports have a `slug` for a location, which is a url-friendly location representation, e.g. "butte-county-california-us".
* **Combining data sources:** Sometimes multiple sources cover the same location.  For example, JHU, New York Times, and California sources may all submit data for California.  These sources are combined in the final reports where possible, and conflicts are resolved by priority.  See [Combining Data Sources](#combining-data-sources).
* **Integration testing samples:** samples for automated test verification are in `tests/integration/events/reports/expected-results`.

# Locations

## locations.json

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

## locations.csv

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles
```

## features.json

The source data for this report is from https://github.com/hyperknot/country-levels.  The report is generated and posted to s3 using `./tools/geojsondb`.  See the README in that folder.

The report is comprised of geojson and census data, keyed by `locationID`.

```
{
  "iso1:us#iso2:us-al#fips:01001": {
    "geometry": {
      "coordinates": [
        [
          [ -86.918, 32.664 ],
          [ -86.817, 32.66 ],
          ...
        ]
      ],
      "type": "Polygon"
    },
    "properties": {
      "area_m2": 1566509298,
      "census_data": {
        "AFFGEOID": "0500000US01001",
        "ALAND": 1539602123,
        "AWATER": 25706961,
        "COUNTYNS": "00161526",
        "LSAD": "06"
      },
      "center_lat": 32.54,
      "center_lon": -86.64,
      "countrylevel_id": "fips:01001",
      "county_code": 1,
      "fips": "01001",
      "name": "Autauga County",
      "name_long": "Autauga County, AL",
      "population": 55869,
      "state_code_int": 1,
      "state_code_iso": "US-AL",
      "state_code_postal": "AL",
      "timezone": "America/Chicago"
      },
    "type": "Feature"
  },
  ...
}
```

# Latest

## latest.json

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
  "sources": [
    "json-source"
  ],
  "cases": 21,
  "deaths": 4,
  "tested": 200,
  "hospitalized": 5,
  "icu": 2
}
```

## latest.csv

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,cases,deaths,recovered,active,tested,hospitalized,hospitalized_current,discharged,icu,icu_current
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,4,,,200,5,,,2,
```

# Timeseries

## timeseries-byLocation.json

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
  "dates": {
    "2020-05-21": {
      "cases": 21,
      "deaths": 4,
      "tested": 210,
      "hospitalized": 1,
      "icu": 10
    },
    ...
  },
  "dateSources": {
    "2020-05-21..2020-06-18": "us-ca",
    "2020-06-19": { "us-ca": [ "deaths" ], "jhu": [ "cases" ] }
  },
  "sources": [
    "us-ca", "jhu"
  ],
  "maintainers": [
    {
      "name": "John Smith",
      "github": "jsmith42"
    }
  ]
}
```

### Combining Data Sources

The data fields in a given record can be supplied by many sources: one source may return cases and deaths, and another return hospitalizations and tests.  The field `dateSources` shows where each field comes from.

A shorthand is shown for the date ranges for which the sources supplied data.  For example, `"2020-05-21..2020-06-18": "src"` means that `src` supplied the data from 05-21 to 06-18.

If there are conflicts in the data (e.g., multiple sources return `cases`, but they're inconsistent), a `warnings` element is added.  e.g.,

```
"warnings": {
  "2020-06-19": {
    "cases": "conflict (src1: 3, src2: 2, src3: 1)",
    "deaths": "conflict (src2: 22, src3: 11)"
  },
  ...
```


## timeseries-jhu.csv

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,2020-05-21,2020-05-22
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,22
```

## timeseries-tidy-small.csv

```
locationID,date,type,value
iso1:us#iso2:us-ca#fips:06007,2020-06-28,cases,21
iso1:us#iso2:us-ca#fips:06007,2020-06-28,deaths,4
iso1:us#iso2:us-ca#fips:06007,2020-06-28,tested,200
iso1:us#iso2:us-ca#fips:06007,2020-06-28,hospitalized,5
iso1:us#iso2:us-ca#fips:06007,2020-06-28,icu,2
```

## timeseries.csv

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,cases,deaths,recovered,active,tested,hospitalized,hospitalized_current,discharged,icu,icu_current,date
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,4,,,210,1,,,10,,2020-05-21
```
