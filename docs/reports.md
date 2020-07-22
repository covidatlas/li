This doc compares a sample Corona Data Scraper (CDS) record with a Li record.  _If you note any errors in this doc, please [open an issue](https://github.com/covidatlas/li/issues/new/choose), notify us on Slack, or issue a Pull Request._

- [Changes from coronadatascraper.com reports](#changes-from-coronadatascrapercom-reports)
  * [Major changes](#major-changes)
  * [Minor changes](#minor-changes)
  * [General notes](#general-notes)
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

# Changes from coronadatascraper.com reports

## Major changes

* **Discontinued reports:**
  * `timeseries-tidy.csv`.  This report continually crashed during generation.  We've replaced it with `timeseries-tidy-small.csv`, which contains the same data but removes much of the duplication.
  * `timeseries.json`.  This report was not atomic; it relied on some external resource or resources, and was not clear on its own.

* **Renamed reports:** `data.json` and `data.csv` have been renamed to `latest.json` and `latest.csv` respectively.

## Minor changes

* **Common changes:** Most reports add `locationID` and `slug` (a url-friendly location representation, e.g. "butte-county-california-us")
* **Combining data sources:** Sometimes multiple sources cover the same location.  For example, JHU, New York Times, and California sources may all submit data for California.  These sources are combined in the final reports where possible, and conflicts are resolved by priority.  See [Combining Data Sources](#combining-data-sources).

## General notes

* **locationID:** Every location in Li is identified with a unique `locationID`, comprised of iso1, iso2, and fips codes from https://github.com/hyperknot/country-levels.  Examples: `iso1:US` = United States, `iso1:us#iso2:us-al` = State of Alabama, `iso1:us#iso2:us-al#fips:01125` = Tuscaloosa County, Alabama.
* **Integration testing samples:** samples for automated test verification are in `tests/integration/events/reports/expected-results`.

# Locations

## locations.json

<table>
<tr><th>CDS record</th><th>Li record</th></tr>

<tr>
<td>

```
{
  "country": "Austria",
  "url": "https://info.gesundheitsministerium.at",
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

</td>
<td>

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

</td>
</tr>
</table>

## locations.csv

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles
```

## features.json

The source data for this report is from https://github.com/hyperknot/country-levels.  The report is generated and posted to s3 using `./tools/geojsondb`.  See the README in that folder.

### Li record

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

Replaces `data.json` report.

<table>
<tr><th>CDS record</th><th>Li record</th></tr>

<tr>
<td>

```
{
  "url": "https://...[snip].../us-counties.csv",
  "country": "United States",
  "aggregate": "county",
  "curators": [
    {
      "name": "The New York Times",
      "url": "http://nytimes.com/",
      "twitter": "@nytimes",
      "github": "nytimes"
    }
  ],
  "county": "Autauga County",
  "state": "Alabama",
  "cases": 84,
  "deaths": 4,
  "rating": 0.6274509803921569,
  "coordinates": [
    -86.66499999999999,
    32.507999999999996
  ],
  "tz": [
    "America/Chicago"
  ],
  "featureId": "fips:01001",
  "population": 55869,
  "populationDensity": 35.66464625666353,
  "countryId": "iso1:US",
  "stateId": "iso2:US-AL",
  "countyId": "fips:01001",
  "name": "Autauga County, Alabama, United States",
  "level": "county"
}
```

</td>
<td>

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

</td>
</tr>
</table>


## latest.csv

Replaces `data.csv` report.

### CSD record

```
name,level,city,county,state,country,cases,deaths,recovered,tested,active,population,populationDensity,lat,long,url,aggregate,hospitalized_current,rating,tz,featureId,countryId,stateId,countyId
"Autauga County, Alabama, United States",county,,Autauga County,Alabama,United States,84,4,,,,55869,35.66464625666353,32.507999999999996,-86.66499999999999,https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv,county,,0.6274509803921569,America/Chicago,fips:01001,iso1:US,iso2:US-AL,fips:01001
```

### Li record

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,cases,deaths,recovered,active,tested,hospitalized,hospitalized_current,discharged,icu,icu_current
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,4,,,200,5,,,2,
```

# Timeseries

## timeseries-byLocation.json

<table>
<tr><th>CDS record</th><th>Li record</th></tr>

<tr>
<td>

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
      "url": "https://github.com/daenuprobst/covid19/"
  },
```

</td>
<td>

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

</td>
</tr>
</table>

#### Changes

* added locationID, slug, sources, dateSources, potentially add warnings
* tz is not in an array
* removed rating, url, featureId

#### Combining Data Sources

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

### CDS record

```
name,level,city,county,state,country,lat,long,population,url,aggregate,tz,2020-06-02,2020-06-03,...
"Lower Austria, Austria",state,,,Lower Austria,Austria,48.22100,15.7605,1653419,https:...js,,Europe/Vienna,2867,2868,...
```

### Li record

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,2020-05-21,2020-05-22
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,22
```


## timeseries-tidy-small.csv

This has replaced the old `timeseries-tidy.csv` report.  You can pull in the location data using `locations.csv`.

### CDS record

```
name,level,city,county,state,country,population,lat,long,aggregate,tz,date,type,value
"Lower Austria, Austria",state,,,Lower Austria,Austria,1653419,48.221000000000004,15.7605,,Europe/Vienna,2020-06-02,cases,2867
```

### Li record

```
locationID,date,type,value
iso1:us#iso2:us-ca#fips:06007,2020-06-28,cases,21
iso1:us#iso2:us-ca#fips:06007,2020-06-28,deaths,4
iso1:us#iso2:us-ca#fips:06007,2020-06-28,tested,200
iso1:us#iso2:us-ca#fips:06007,2020-06-28,hospitalized,5
iso1:us#iso2:us-ca#fips:06007,2020-06-28,icu,2
```

## timeseries.csv

### CDS record

```
name,level,city,county,state,country,population,lat,long,url,aggregate,tz,cases,deaths,recovered,active,tested,hospitalized,hospitalized_current,discharged,icu,icu_current,growthFactor,date
"Lower Austria, Austria",state,,,Lower Austria,Austria,1653419,48.221000000000004,15.7605,https://info.gesundheitsministerium.at/data/GenesenTodesFaelleBL.js,,Europe/Vienna,2867,97,2678,92,,,,,,,,2020-06-02
```

### Li record

```
locationID,slug,name,level,city,county,state,country,lat,long,population,aggregate,tz,cases,deaths,recovered,active,tested,hospitalized,hospitalized_current,discharged,icu,icu_current,date
iso1:us#iso2:us-ca#fips:06007,butte-county-california-us,"Butte County, California, US",county,,Butte County,California,United States,39.67,-121.6,219186,,America/Los_Angeles,21,4,,,210,1,,,10,,2020-05-21
```
