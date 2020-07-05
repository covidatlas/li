# Geojson database load

A set of short scripts to prepare and load geojson data from Zsolt Ero's work to the DynamoDB table `geojson`, and to generate a report `features.json` for consumers.

## Usage

```
# 1.
cd path/to/this/directory

# 2. Install `node_modules/country-levels/geojson/` files
npm install

# 3. Generate geojson-db-payload.json (~11 MB file, takes ~2 mins)
node geojsondb.js

# 4. Write geojson-db-payload.json to your local DynamoDB, and generate features.json
node write.js
```

## Operations/launching

For the following, you'll need the `covidatlas` profile set up on your machine with appropriate entries in your `~/.aws` files.

### Publish `features.json` to s3

```
NODE_ENV=staging AWS_PROFILE=covidatlas node upload-report-to-s3.js
```

### Loading `geojson-db-payload.json` to the DynamoDB table `geojson`

It _appears_ that you could then run the write script as follows:

```
NODE_ENV=staging AWS_PROFILE=covidatlas ARC_CLOUDFORMATION=LiStaging node write.js
```

or

```
NODE_ENV=production AWS_PROFILE=covidatlas ARC_CLOUDFORMATION=LiProduction node write.js
```
