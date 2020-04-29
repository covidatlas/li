#! /usr/bin/env node

const arc = require('@architect/functions')
const { join } = require('path')
const { readFileSync } = require('fs')

const filename = 'geojson-db-payload.json'
const payload = require(join(__dirname, filename))

// process.env.ARC_CLOUDFORMATION = 'CovidAtlasStaging'
// process.env.NODE_ENV = 'staging'

;(async () => {
  console.time('Populating GeoJSON DB')
  const data = await arc.tables()
  for (const item of payload) {
    console.log(`Writing:`, item.locationID)
    await data.geojson.put(item)
  }
  console.timeEnd('Populating GeoJSON DB')
})()
