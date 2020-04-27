const arc = require('@architect/functions')

const getLocationNames = require('./get-location-names/index.js')
const annotateLocations = require('./annotate/index.js')
const upsertLocations = require('./upsert/index.js')

async function updateLocations (event) {
  try {
    let { locationIDs } = event
    console.time('Update locations')

    /**
     * Get the normalized names of each locationID
     */
    const locationNames = getLocationNames(locationIDs)

    /**
     * Annotate and normalize data
     */
    const locations = annotateLocations(locationNames)

    /**
     * Upsert location data
     */
    await upsertLocations(locations)

    console.timeEnd('Update locations')
  }
  catch (err) {
    console.error(`Failed to update locations ${event.locationIDs}`)
    throw err
  }
}

exports.handler = arc.events.subscribe(updateLocations)
