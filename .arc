@app
li

@aws
profile covidatlas
region us-west-1

@http
get /get/normal
get /get/headless

@events
crawler # Crawls our sources
scraper # Operates the scrapers

@scheduled
regenerate rate(1 hour) # Regenerates timeseries sources

@tables
# case-data
#   location *String
#   source **String

# Keeps track of regenerate invocations
invokes
  type *String
  key **String
  # sourceKey
  # lastRan
  # contentHash
