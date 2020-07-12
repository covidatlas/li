# Analyze reports

A handful of scripts to analyze generated reports.

This is very much work-in-progress.  Ideally checks would be converted to AWS Lambdas and auto-generated reports for continuous checks.


## Installation

Install everything:

```
cd tools
npm install
cd analyze-reports
```

## Scripts

| Script | Description |
| --- | --- |
| `node download.js` | Download report from production reports bucket. |
| `node analyze-reports.js` | Generate analysis file. |
| `node get-location-timeseries.js iso1:at#iso2:at-1` | Check a single `locationID` in the downloaded file. |


## Google spreadsheet analysis

Import any generated files into Google sheets and hack away.

Sample Link: https://docs.google.com/spreadsheets/d/1Xeq7nJdEbXtYpDR9LlXva2pZJfjNJtonDn7vSKuTFX0/edit#gid=766064631

Ideally, these reports and analysis would be created on automatic jobs and be posted to live somewhere.