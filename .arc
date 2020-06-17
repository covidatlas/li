@app
li


@aws
profile covidatlas
region us-west-1


@cdn
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
status      # Status updater


@scheduled
runner rate(2 hours)            # Regularly invokes crawls and scrapes
regen-timeseries rate(2 hours)  # Regularly regenerates timeseries sources
report rate(12 hours)           # Generate flat file reports covering our entire data set


@storage-public
cache   # Main crawler cache


@tables
# Primary location store
locations
  slug        *String

# Per-location case data
case-data
  locationID  *String
  dateSource  **String

# Keeps track of regenerate invocations
invokes
  type        *String
  key         **String
  # sourceKey
  # lastRan
  # contentHash

# GeoJSON features for fips + iso1 + iso2 locations
geojson
  locationID  *String

# Monitors source status
status
  source      *String
  event       **String

# Running log of source status changes
status-logs
  source      *String
  ts          **String

@indexes
locations
  locationID  *String

case-data
  locationID  *String
  date        **String


@macros
architect/macro-storage-public
public-bucket-policy
