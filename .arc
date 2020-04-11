@app
li

@aws
profile covidatlas
region us-west-1

@http
get /get/normal
get /get/headless

@events
crawler # Crawls our locations
