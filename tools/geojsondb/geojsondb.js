#! /usr/bin/env node

const glob = require('glob').sync
const fs = require('fs')
const { basename, join, sep } = require('path')
const { brotliCompressSync } = require('zlib')
const fipsCodes = require('country-levels/fips.json')

console.time('Ran in')

const dir = join(__dirname, 'node_modules', 'country-levels', 'geojson')

let files = glob(join(dir, '**'), { nodir: true })

let keep = [ 'fips', 'iso1', 'iso2' ]
const filter = f => keep.some(k => f.startsWith(join(dir, k, sep)))
files = files.filter(filter)
const fipsFiles = files.filter(f => f.startsWith(join(dir, 'fips', sep)))
const iso2Files = files.filter(f => f.startsWith(join(dir, 'iso2', sep)))
const iso1Files = files.filter(f => f.startsWith(join(dir, 'iso1', sep)))

let counter = 0
let stats = {
  fips: 0,
  fipsLargest: '',
  fipsTime: 0,
  iso2: 0,
  iso2Largest: '',
  iso2Time: 0,
  iso1: 0,
  iso1Largest: '',
  iso1Time: 0,
}

function sizeCheck (item, type) {
  const size = JSON.stringify(item).length
  if (size >= 1000 * 400) {
    throw Error(`Payload limit exceeded on ${item.locationID}!`)
  }
  console.log(`${item.locationID} size: ${size} | ${size / 1000} KB`)
  counter++
  if (size > stats[type]) {
    stats[type] = size
    stats[`${type}Largest`] = item.locationID
  }
}

const isBase64Encoded = true

function buildMapper (type, locationIDBuilder) {
  return code => {
    let file = fs.readFileSync(code)
    const item = {
      locationID: locationIDBuilder(code),
      payload: brotliCompressSync(file).toString('base64'),
      isBase64Encoded
    }
    sizeCheck(item, type)
    return item
  }
}

function fipIDBuilder (fip) {
  let id = basename(fip, '.geojson')
  const data = fipsCodes[id]
  let iso2 = data.state_code_iso
  if (!iso2) throw ReferenceError(`Missing iso2 code for ${fip}`)
  return `iso1:us#iso2:${iso2}#fips:${id}`.toLowerCase()
}

function iso2IDBuilder (state) {
  let id = basename(state, '.geojson')
  return `iso1:${id.substr(0, 2)}#iso2:${id}`.toLowerCase()
}

function iso1IDBuilder (country) {
  let id = basename(country, '.geojson')
  return `iso1:${id}`.toLowerCase()
}

const fipMapper = buildMapper('fips', fipIDBuilder)
const iso2Mapper = buildMapper('iso2', iso2IDBuilder)
const iso1Mapper = buildMapper('iso1', iso1IDBuilder)

let now = Date.now()
const fips = fipsFiles.map(fipMapper)
stats.fipsTime = Date.now() - now

now = Date.now()
const iso2 = iso2Files.map(iso2Mapper)
stats.iso2Time = Date.now() - now

now = Date.now()
const iso1 = iso1Files.map(iso1Mapper)
stats.iso1Time = Date.now() - now

console.log(`Processed ${counter} items`)

const payload = JSON.stringify(fips.concat(iso1, iso2))
const filename = 'geojson-db-payload.json'
fs.writeFileSync(join(__dirname, filename), payload)
console.log(`Wrote ${filename} (${payload.length / 1000}KB)`)

console.log(`Stats:`, stats)

console.timeEnd('Ran in')


/**
 * Write feature report file.
 */

console.time('Report in')

const featureReportSrc = [
  [ fipsFiles, fipIDBuilder ],
  [ iso2Files, iso2IDBuilder ],
  [ iso1Files, iso1IDBuilder ]
]

console.log('Generating features.json')
let n = 0
const featureReport = featureReportSrc.
      map(pair => {
        const [ files, locationIDBuilder ] = pair
        return files.map(f => {
          if (n % 100 === 0)
            console.log(` ${n}`)
          n++
          return {
            locationID: locationIDBuilder(f),
            content: fs.readFileSync(f, 'utf-8')
          }
        })
      }).
      flat().
      reduce((hsh, val) => {
        return Object.assign(hsh, { [val.locationID]: val.content })
      }, {})

const content = JSON.stringify(featureReport)
const report = 'features.json'
fs.writeFileSync(join(__dirname, report), content)

const fstats = fs.statSync(join(__dirname, report))
console.log(`Wrote ${report} (${fstats['size'] / 1000} KB)`)
console.timeEnd('Report in')
