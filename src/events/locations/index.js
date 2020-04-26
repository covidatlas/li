const arc = require('@architect/functions')
// const datetime = require('@architect/shared/datetime/index.js')

const upsertLocations = require('./upsert/index.js')

async function updateLocations (event) {
  try {
    let { locationIDs } = event
    console.time('Update locations')

    /**
     * Upsert location data
     */
    await upsertLocations(locationIDs)

    console.timeEnd('Update locations')
  }
  catch (err) {
    console.error(`Failed to update locations ${event.locationIDs}`)
    throw Error(err)
  }
}

exports.handler = arc.events.subscribe(updateLocations)
