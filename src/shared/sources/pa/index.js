// Informed by coronadatascraper/src/shared/scrapers/PA/index.js, but mostly rewritten.

const srcShared = '../../'
const assert = require('assert')
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const arcgis = require(srcShared + 'sources/_lib/arcgis.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


// Panama is divided into ten provinces (Spanish: provincias). There
// are three provincial-level indigenous regions (Spanish: comarcas
// indígenas, often foreshortened to comarcas).
// Ref: Ref https://en.wikipedia.org/wiki/Provinces_of_Panama
const provinceIso2 = {
  'Bocas del Toro': 'iso2:PA-1',
  'Chiriquí': 'iso2:PA-4',
  'Coclé': 'iso2:PA-2',
  'Colón': 'iso2:PA-3',
  'Darién': 'iso2:PA-5',
  'Herrera': 'iso2:PA-6',
  'Los Santos': 'iso2:PA-7',
  'Panamá': 'iso2:PA-8',
  'Panamá Oeste': 'iso2:PA-10',
  'Veraguas': 'iso2:PA-9',

  'Ngöbe-Buglé': 'iso2:PA-NB',
  'Embera Wounaan': 'iso2:PA-EM',
  'Guna Yala': 'iso2:PA-KY'
}

// Load extra spellings/cases from https://en.wikipedia.org/wiki/ISO_3166-2:PA
function loadAdditionalIso2Mappings () {
  const variants = {
    'Kuna Yala': 'Guna Yala',
    'Comarca Guna Yala': 'Guna Yala',
    'Darien': 'Darién',
    'Emberá': 'Embera Wounaan',
    'Ngäbe-Buglé': 'Ngöbe-Buglé',
    'Comarca Ngäbe Buglé': 'Ngöbe-Buglé'
  }
  Object.keys(variants).forEach(k => {
    provinceIso2[k] = provinceIso2[variants[k]]
  })
  Object.keys(provinceIso2).forEach(k => {
    provinceIso2[k.toUpperCase()] = provinceIso2[k]
  })
}

loadAdditionalIso2Mappings()


module.exports = {

  country: 'iso1:PA',
  aggregate: 'state',
  priority: 1,
  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  friendly:   {
    url: 'http://minsa.gob.pa/coronavirus-covid19',
    name: 'Ministerio de Salud de la República de Panamá'
  },
  scrapers: [
    {
      // TODO (scrapers) Move iso1:pa scraper start date back if more data is available.
      startDate: '2020-07-07',
      crawl: [
        {
          type: 'json',
          paginated: arcgis.paginated(
            'https://services7.arcgis.com/DZ7X0JkY6tNyCr3s/arcgis/rest/services/CORREGIMIENTOS_DIARIOS_(PU)/FeatureServer/0/query',
            // The defaults in arcgis.paginated weren't returning the
            // exceededTransferLimit element, so using an exhaustive
            // list of args reverse-engineered from the arcgis query
            // UI.
            {
              geometryType: 'esriGeometryEnvelope',
              spatialRel: 'esriSpatialRelIntersects',
              resultType: 'none',
              distance: 0.0,
              units: 'esriSRUnit_Meter',
              returnGeodetic: false,
              returnGeometry: false,
              featureEncoding: 'esriDefault',
              multipatchOption: 'xyFootprint',
              applyVCSProjection: false,
              returnIdsOnly: false,
              returnUniqueIdsOnly: false,
              returnCountOnly: false,
              returnExtentOnly: false,
              returnQueryGeometry: false,
              returnDistinctValues: false,
              cacheHint: false,
              returnZ: false,
              returnM: false,
              returnExceededLimitFeatures: true,
            }
          )
        },
      ],
      scrape (data, date) {

        // They report dates as epoch ms, eg 1584532800000 = 2020-03-18.
        function toYYYYMMDD (n) {
          const d = new Date(n)
          return d.toISOString().split('T')[0]
        }

        const { filterDate, func } = timeseriesFilter(data, 'FECHA', toYYYYMMDD, date)

        const missingIso2 = [ ...new Set(data.map(d => d.PROVINCIA).map(d => d.trim())) ].
              filter(s => !provinceIso2[s])
        assert(missingIso2.length === 0, `Missing iso2 for:\n${missingIso2.join('\n')}`)

        // PA state data is further broken down into "districts" and
        // "corregimientos."  Since the mapping potentially
        // convoluted, am skipping that for now and simply rolling it
        // up.
        const stateData = data.filter(func).map(row => {
          return {
            state: provinceIso2[row.PROVINCIA.trim()],
            hospitalized_current: row.HOSPITALIZADO || 0,
            deaths: row.FALLECIDO || 0,
            icu_current: row.UCI || 0,
            recovered: (row.RECUPERADO || 0),
            cases: (row.ACTIVOS || 0) + (row.RECUPERADO || 0) + (row.FALLECIDO || 0),
            date: filterDate
          }
        })

        const states = [ ...new Set(stateData.map(d => d.state)) ]

        const sumfields = [
          'hospitalized_current',
          'deaths',
          'icu_current',
          'recovered',
          'cases'
        ]

        const stateSums = states.reduce((arr, s) => {
          const summary = stateData.
                filter(d => d.state === s).
                reduce((sum, rec) => {
                  sumfields.forEach(f => sum[f] += rec[f])
                  return sum
                })
          arr.push(summary)
          return arr
        }, [])

        stateSums.push({ ...transform.sumData(stateSums), date: filterDate })
        return stateSums
      }
    }
  ]
}
