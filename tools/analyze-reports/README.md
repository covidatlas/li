# Analyze reports

TBD docs


## WORK-IN-PROGRESS - things we can do



## Usage

Install everything.

```
cd /to/parent/tools/directory
npm install
```

Generate analysis files.

```
cd /to/this/directory

# Download the file(s) from s3 prior to analysis
node analyze-reports.js --download

# Analyze without download
node analyze-reports.js
```

Import generated files into Google sheets and do analysis.