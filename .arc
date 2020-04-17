@app
li

@aws
profile covidatlas
region us-west-1

@http
get /get/normal
get /get/headless

@events
crawler     # Crawls our sources
scraper     # Operates the scrapers
regenerator # Regenerates a source from cache

@scheduled
regen-timeseries rate(1 hour) # Regularly regenerates timeseries sources

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
