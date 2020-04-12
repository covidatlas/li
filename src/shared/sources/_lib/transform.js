// const datetime = require('./datetime/index.js')

module.exports = {
  getGrowthfactor,
  normalizeString,
  objectToArray,
  removePrivate,
  sumData,
  toTitleCase,
  // transposeTimeseries,
}


/**
 * Get the growth factor for two numbers, null if infinite
 */
function getGrowthfactor (casesToday, casesYesterday) {
  const growthFactor = casesToday / casesYesterday
  if (growthFactor === Infinity) {
    return null
  }
  return growthFactor
}

/**
 * Normalize a string (no accents, lowercase) for comparison
 */
function normalizeString (str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Convert an object keyed on county name to an array
 */
function objectToArray (object) {
  const array = []
  for (const [county, data] of Object.entries(object)) {
    array.push({
      county,
      ...data
    })
  }

  return array
}

/**
 * Remove "private" object properties
 */
function removePrivate (data) {
  for (const [prop, value] of Object.entries(data)) {
    if (value === '' || prop[0] === '_') {
      delete data[prop]
    }
  }

  return data
}


/**
 * Sum the passed array of data into a single object with the properties of the optional, second argument
 */
function sumData (dataArray, object) {
  const caseFields = [
    'cases',
    'recovered',
    'active',
    'deaths',
    'tested',
    'hospitalized',
    'discharged'
  ]
  const summedData = { ...object }
  for (const data of dataArray) {
    for (const field of caseFields) {
      if (data[field]) {
        summedData[field] = summedData[field] || 0
        summedData[field] += data[field]
      }
    }
  }

  // Automatically elevate the priority
  if (summedData.priority < 1) {
    summedData.priority = 1
  }

  return summedData
}

/**
 * Titlecase a string, badly
 */
function toTitleCase (string) {
  return string
    .split(' ')
    .map(part => part.substr(0, 1).toUpperCase() + part.substr(1).toLowerCase())
    .join(' ')
}

/**
 * Turn a timeseries into a date-based bit
 */
/*
function transposeTimeseries (timeseriesByLocation) {
  function getProps(location) {
    const newLocation = { ...location }
    delete newLocation.dates
    return newLocation
  }

  // Find all dates and locations
  const locations = []
  let allDates = []
  for (const [locationName, location] of Object.entries(timeseriesByLocation)) {
    for (const [date] of Object.entries(location.dates)) {
      if (!allDates.includes(date)) {
        allDates.push(date)
      }
    }
    const newLocation = getProps(location)
    newLocation.name = locationName
    locations.push(newLocation)
  }

  // Sort dates
  allDates = allDates.sort((a, b) => {
    if (a === b) {
      return 0
    }

    if (datetime.dateIsBefore(a, b)) {
      return -1
    }
    return 1
  })

  const timeseriesByDate = {}
  // Iterate over all dates, add data
  for (const date of allDates) {
    timeseriesByDate[date] = {}

    let index = 0
    for (const location of locations) {
      const locationData = timeseriesByLocation[location.name]
      if (locationData.dates[date]) {
        timeseriesByDate[date][index] = locationData.dates[date]
      }
      index++
    }
  }

  return { timeseriesByDate, locations }
}
*/
