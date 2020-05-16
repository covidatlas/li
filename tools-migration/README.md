# A couple of helpers

These assume that you have the latest CDS and Li repos.

## `migrate-cds-scraper.js`: Bootstrap migration of CDS scraper to li

This is really hacky, and may not even work for some scrapers ... but
it works for a couple at least, and perhaps you can tweak it if you
need to handle a special case.

```
node tools-migration/migrate-cds-scraper.js <path/to/cds/scraper.js> <rel/path/under/src/shared/sources>

# E.g.
node tools-migration/migrate-cds-scraper.js ../coronadatascraper/src/shared/scrapers/AT/index.js at/index.js
```

The script moves things around and copies things as best it can, and
prints some (obvious) todos at the bottom of the file.


## `tools-migration/report-cds-vs-li.js`: compares CDS and Li output

This shows a table of output from raw files generated from CDS and Li.

```
===================================

Table headers are: _c = cases, _r = recovered, _d = deaths.
The headers 'x=?' indicates if the corresponding fields were the same.

===================================

...
iso1:KR/iso2:KR-26/undefined
┌─────────┬──────────────┬───────┬──────┬─────┬───────┬──────┬─────┬───────┬──────┬─────┐
│ (index) │     date     │ cds_c │ li_c │ c=? │ cds_r │ li_r │ r=? │ cds_d │ li_d │ d=? │
├─────────┼──────────────┼───────┼──────┼─────┼───────┼──────┼─────┼───────┼──────┼─────┤
│    0    │ '2020-05-08' │  141  │ 140  │ 'x' │  125  │ 123  │ 'x' │   3   │  3   │ ''  │
│    1    │ '2020-05-09' │  141  │ 141  │ ''  │  125  │ 125  │ ''  │   3   │  3   │ ''  │
│    2    │ '2020-05-10' │ null  │ 141  │ 'x' │ null  │ 125  │ 'x' │ null  │  3   │ 'x' │
└─────────┴──────────────┴───────┴──────┴─────┴───────┴──────┴─────┴───────┴──────┴─────┘

```

e.g, the above shows that for `iso1:KR/iso2:KR-26/undefined` on
`2020-05-08`, CDS showed 141 cases, but Li showed 140, so an 'X' is
shown in `c=?`.  Both CDS and Li reported 3 deaths for that date, so
`d=?` is blank (for yes).

### Generating raw data files

#### CDS

To generate CDS raw files, run timeseries specifying the location, eg,

```
yarn timeseries --date 2020-05-08 --endDate 2020-05-10 --location KR
```

#### Li

To generate Li raw files, run gen-raw-files, specifying the source, eg,

```
node tools/gen-raw-files.js --date 2020-05-08 --endDate 2020-05-10 --source kr --output zz-kr-out
```


### Running the script

To create a console table showing the comparison, use this new script:

```
node tools-migration/report-cds-vs-li.js <path/to/li/raw> <path/to/cds/dist/>

# e.g.

node tools-migration/report-cds-vs-li.js zz-kr-out/ ../coronadatascraper/dist/
```