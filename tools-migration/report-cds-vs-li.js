/* Hacky hacky */

const fs = require('fs')
const path = require('path')

const glob = require('glob')

/** Glob always uses forward slash for separator, regardless of OS. */
function globJoin (...args) {
  return path.join(...args).replace(/\\/g, '/')
}

///////////////////////////////////////////////////////
// Gather Li Data

const dirname = process.argv[2]
if (!fs.existsSync(dirname)) {
  console.log(`No dir ${dirname}, quitting.`)
  process.exit(0)
}

// Get all the li raw files
// build the thing
// { name: blah, key: blah, dates: { d1: { case data }, d2: ... },
// get the CDS timeseries file

const pattern = globJoin(dirname, 'raw-li-locations-*.json')
const matches = []
glob.sync(pattern).forEach(fname => { matches.push(fname) })

if (matches.length === 0) {
  console.log(`No raw-li files in dir ${dirname}, quitting.`)
  process.exit(0)
}

const rawLiData = []

matches.forEach(m => {
  // console.log(m)
  const locations = JSON.parse(fs.readFileSync(m, 'utf-8'))
  // console.log(locations)
  locations.forEach(loc => {
    const datepart = m.split('locations-')[1].replace('.json', '')
    const key = `${loc.country}/${loc.state}/${loc.county}`
    const record = {
      key,
      date: datepart,
      cases: loc.cases,
      recovered: loc.recovered,
      deaths: loc.deaths,
      tested: loc.tested,
      hospitalized: loc.hospitalized
    }
    rawLiData.push(record)
  })
})

// console.table(rawLiData)

///////////////////////////////////////////////////////
// Gather CDS Data

const cdsDirname = process.argv[3]
if (!fs.existsSync(cdsDirname)) {
  console.log(`No dir ${cdsDirname}, quitting.`)
  process.exit(0)
}

const cdsTs = path.join(cdsDirname, 'timeseries-byLocation.json')
const cdsJson = JSON.parse(fs.readFileSync(cdsTs, 'utf-8'))

const rawCdsData = []
Object.keys(cdsJson).forEach(k => {
  const loc = cdsJson[k]
  const key = `${loc.countryId}/${loc.stateId}/${loc.countyId}`
  Object.keys(loc.dates).forEach(datepart => {
    const record = {
      key,
      date: datepart,
      cases: loc.dates[datepart].cases,
      recovered: loc.dates[datepart].recovered,
      deaths: loc.dates[datepart].deaths,
      tested: loc.dates[datepart].tested,
      hospitalized: loc.dates[datepart].hospitalized
    }
    rawCdsData.push(record)
  })
})

// console.log(JSON.stringify(rawCdsData, null, 2))
// console.table(rawCdsData)

///////////////////////////////////////////////////////
// Combine and print

// For filtering arrays
function onlyUnique (value, index, self) {
  return self.indexOf(value) === index
}

function allUniqueValues (keyname) {
  let all = rawLiData.map(d => d[keyname])
  all = all.concat(rawCdsData.map(d => d[keyname]))
  all = all.filter(onlyUnique).sort()
  return all
}


console.log(`
===================================

Table headers are: c = cases, r = recovered, d = deaths, t = tested, h = hosp'd
The headers 'x=?' indicates if the corresponding fields were the same.

===================================
`)

const allDates = allUniqueValues('date')

// CDS data uses CDS dates (e.g., data in the Apr 1 folder is reported
// as "2020-04-01") but it's exported to UTC date/tame next day at
// 4:00 am (e.g Apr 2 4:00 am UTC) in Li.  Therefore to compare we
// need to look at CDS-prior-date data (i.e., compare Apr 2 Li to Apr
// 1 CDS)
function getPriorDay (date) {
  const i = allDates.indexOf(date)
  if (i === 0)
    return null
  return allDates[i - 1]
}

allUniqueValues('key').forEach(key => {
  const combinedData = []

  allDates.forEach(date => {
    function get (array, field, date) {
      const tmp = array.filter(d => d.key === key && d.date === date)
      if (tmp.length === 0)
        return null
      if (!tmp[0][field])
        return null
      return tmp[0][field]
    }

    function getPair (field, shortName) {
      const hsh = {}
      const cds = get(rawCdsData, field, getPriorDay(date))
      const li = get(rawLiData, field, date)
      hsh['cds_' + shortName] = cds
      hsh['li_' + shortName] = li
      hsh[shortName + '=?'] = (cds === li ? '' : 'x')
      return hsh
    }

    let record = {
      date,
      ...getPair('cases', 'c'),
      ...getPair('recovered', 'r'),
      ...getPair('deaths', 'd'),
      ...getPair('tested', 't'),
      ...getPair('hospitalized', 'h')
    }

    combinedData.push(record)
  })

  // Keep rows with any non-null cds or li value.
  const hasData = record => {
    const flds = Object.keys(record).filter(k => k.match(/^(cds|li)_.$/))
    return flds.some(k => record[k] !== null)
  }

  function removeNullColumns (d) {
    const headings = [ 'c', 'r', 'd', 't', 'h' ]
    headings.forEach(c => {
      const fields = [ `cds_${c}`, `li_${c}`, `${c}=?` ]
      const hasData = d.filter(r => {
        return fields.some(f => { return r[ f ] !== null && r[ f ] !== '' })
      })
      if (hasData.length === 0) {
        d = d.map(row => {
          fields.forEach(f => delete row[f])
          return row
        })
      }
    })
    return d
  }

  console.log()
  console.log(key)
  console.table(removeNullColumns(combinedData.filter(hasData)))
})

