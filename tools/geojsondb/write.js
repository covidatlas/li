#! /usr/bin/env node

// process.env.ARC_CLOUDFORMATION = 'LiStaging'
// process.env.AWS_REGION = 'us-west-1'
// process.env.AWS_PROFILE = 'covidatlas'
// process.env.NODE_ENV = 'staging'

const arc = require('@architect/functions')
const { join } = require('path')

const filename = 'geojson-db-payload.json'
const payload = require(join(__dirname, filename))

;(async () => {
  console.time('Populating GeoJSON DB')
  const data = await arc.tables()
  for (const item of payload) {
    console.log(`Writing:`, item.locationID)
    await data.geojson.put(item)
  }
  console.timeEnd('Populating GeoJSON DB')
})()
