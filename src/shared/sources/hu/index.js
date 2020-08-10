const srcShared = '../../'
const timeseriesFilter = require(srcShared + 'sources/_lib/timeseries-filter.js')
const maintainers = require(srcShared + 'sources/_lib/maintainers.js')
const transform = require(srcShared + 'sources/_lib/transform.js')


/** Add iso2:HU-xx */
const iso2Map = {
  'Bács-Kiskun': 'BK',
  'Baranya': 'BA',
  'Békés': 'BE',
  'Borsod-Abaúj-Zemplén': 'BZ',
  'Budapest': 'BU',
  'Csongrád': 'CS',
  'Fejér': 'FE',
  'Győr-Moson-Sopron': 'GS',
  'Hajú-Bihar': 'HB',
  'Heves': 'HE',
  'Jász-Nagykun-Szolnok': 'JN',
  'Komárom-Esztergom': 'KE',
  'Nógrád': 'NO',
  'Pest': 'PE',
  'Somogy': 'SO',
  'Szabolcs-Szatmár-Bereg': 'SZ',
  'Tolna': 'TO',
  'Vas': 'VA',
  'Veszprém': 'VE',
  'Zala': 'ZA',
}

module.exports = {
  country: 'iso1:HU',
  aggregate: 'state',
  maintainers: [ maintainers.jzohrab ],
  timeseries: true,
  priority: 1,
  friendly:   {
    url: 'https://koronavirus.gov.hu/',
    name: 'Government information page',
  },
  scrapers: [
    {
      startDate: '2020-03-31',
      crawl: [
        {
          type: 'csv',
          url: 'https://docs.google.com/spreadsheets/d/1e4VEZL1xvsALoOIq9V2SQuICeQrT5MtWfBm32ad7i8Q/gviz/tq?tqx=out:csv&sheet=megyei',
        },
      ],
      scrape (data, date) {
        // The date is stored in yyyymmdd already (e.g 2020-03-04)
        const toYYYYMMDD = s => s

        const { filterDate, func } = timeseriesFilter(data, 'Dátum', toYYYYMMDD, date)

        const useData = data.filter(func)[0]
        console.log(Object.keys(useData).
                    map(s => iso2Map[s]).
                    filter(s => s))

        const states = Object.entries(useData).
              map(e => { return { name: e[0], iso2: iso2Map[e[0]], c: e[1] } }).
              filter(h => h.iso2).
              map(h => {
                return {
                  state: `iso2:HU-${h.iso2}`,
                  cases: h.c === '' ? undefined : parseInt(h.c, 10),
                  date: filterDate
                }
              })
        states.push({ ...transform.sumData(states), date: filterDate })
        return states
      }
    }
  ]
}
