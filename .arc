@app
li


@aws
profile covidatlas
region us-west-1


@http
get /get/normal
get /get/headless

# API (api.covidatlas.com)
get /locations
get /locations/:location


@events
crawler     # Crawls our sources
scraper     # Operates the scrapers
locations   # Update location data
regenerator # Regenerates a source from cache


@scheduled
runner rate(1 hour)           # Regularly invokes crawls and scrapes
regen-timeseries rate(1 hour) # Regularly regenerates timeseries sources


@tables
# Primary location store
locations
  name *String

# Per-location case data
case-data
  locationID *String
  dateSource **String

# Keeps track of regenerate invocations
invokes
  type *String
  key **String
  # sourceKey
  # lastRan
  # contentHash


@indexes
locations
  locationID *String

case-data
  locationID *String
