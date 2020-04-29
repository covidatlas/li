#! /usr/bin/env node

const glob = require('glob').sync
const { readFileSync, writeFileSync } = require('fs')
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

let now = Date.now()
const fips = fipsFiles.map(fip => {
  let id = basename(fip, '.geojson')
  const data = fipsCodes[id]
  let file = readFileSync(fip)
  file = brotliCompressSync(file)
  const payload = file.toString('base64')

  let iso2 = data.state_code_iso
  if (!iso2) throw ReferenceError(`Missing iso2 code for ${fip}`)

  const locationID = `iso1:us#iso2:${iso2}#fips:${id}`.toLowerCase()
  const item = {
    locationID,
    payload,
    isBase64Encoded
  }
  sizeCheck(item, 'fips')
  return item
})
stats.fipsTime = Date.now() - now

now = Date.now()
const iso2 = iso2Files.map(state => {
  let id = basename(state, '.geojson')
  let file = readFileSync(state)
  file = brotliCompressSync(file)
  const payload = file.toString('base64')

  const locationID = `iso1:${id.substr(0, 2)}#iso2:${id}`.toLowerCase()
  const item = {
    locationID,
    payload,
    isBase64Encoded
  }
  sizeCheck(item, 'iso2')
  return item
})
stats.iso2Time = Date.now() - now

now = Date.now()
const iso1 = iso1Files.map(country => {
  let id = basename(country, '.geojson')
  let file = readFileSync(country)
  file = brotliCompressSync(file)
  const payload = file.toString('base64')

  const locationID = `iso1:${id}`.toLowerCase()
  const item = {
    locationID,
    payload,
    isBase64Encoded
  }
  sizeCheck(item, 'iso1')
  return item
})
stats.iso1Time = Date.now() - now

console.log(`Processed ${counter} items`)

const payload = JSON.stringify(fips.concat(iso1, iso2))
const filename = 'geojson-db-payload.json'
writeFileSync(join(__dirname, filename), payload)
console.log(`Wrote ${filename} (${payload.length / 1000}KB)`)

console.log(`Stats:`, stats)

console.timeEnd('Ran in')
